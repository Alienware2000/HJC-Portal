"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SYNTHETIC_EMAIL_DOMAIN } from "@/lib/constants";

interface ImportRow {
  board_member_name: string;
  access_code?: string;
  [key: string]: unknown;
}

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

const MAX_IMPORT_ROWS = 1000;
const nameSchema = z.string().min(2).max(200).trim();

export async function importMembers(rows: ImportRow[]): Promise<ImportResult> {
  if (rows.length > MAX_IMPORT_ROWS) {
    return { created: 0, updated: 0, skipped: 0, errors: [{ row: 0, message: `Too many rows (max ${MAX_IMPORT_ROWS})` }] };
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  // Verify caller is admin via profiles table (authoritative source)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { created: 0, updated: 0, skipped: 0, errors: [{ row: 0, message: "Unauthorized" }] };
  }
  const { data: callerProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!callerProfile || callerProfile.role !== "admin") {
    return { created: 0, updated: 0, skipped: 0, errors: [{ row: 0, message: "Unauthorized" }] };
  }

  // Get active event
  const { data: event } = await supabase
    .from("events")
    .select("id, year")
    .eq("is_active", true)
    .single();

  if (!event) {
    return { created: 0, updated: 0, skipped: 0, errors: [{ row: 0, message: "No active conference event. Open the admin dashboard to set one up first." }] };
  }

  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawName = row.board_member_name?.trim();
    const nameResult = nameSchema.safeParse(rawName);
    if (!nameResult.success) {
      result.errors.push({ row: i + 1, message: "Invalid or missing board member name (2-200 chars)" });
      continue;
    }
    const name = nameResult.data;

    try {
      // Check if access code already exists
      let accessCode = row.access_code?.toString().trim().toUpperCase();

      if (accessCode) {
        const { data: existing } = await supabase
          .from("access_codes")
          .select("id, is_used, board_member_id")
          .eq("event_id", event.id)
          .eq("code", accessCode)
          .single();

        if (existing?.is_used && existing.board_member_id) {
          // Update existing member's directory fields and itinerary
          const bmFields = extractBoardMemberFields(row);
          const itineraryFields = extractItineraryFields(row);
          let didUpdate = false;
          if (Object.keys(bmFields).length > 0) {
            await admin
              .from("board_members")
              .update(bmFields)
              .eq("id", existing.board_member_id);
            didUpdate = true;
          }
          if (Object.keys(itineraryFields).length > 0) {
            await supabase
              .from("itineraries")
              .update(itineraryFields)
              .eq("board_member_id", existing.board_member_id);
            didUpdate = true;
          }
          if (didUpdate) result.updated++;
          else result.skipped++;
          continue;
        }
      }

      // Generate access code if not provided
      if (!accessCode) {
        const nameParts = name.split(/\s+/);
        const lastName = nameParts[nameParts.length - 1].toUpperCase();
        const baseCode = `${lastName}-${event.year}`;

        // Check if base code is taken, add random suffix if needed
        const { data: existingCodes } = await supabase
          .from("access_codes")
          .select("code")
          .eq("event_id", event.id)
          .eq("code", baseCode);

        accessCode = existingCodes && existingCodes.length > 0
          ? `${baseCode}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`
          : baseCode;
      }

      // Create access code
      const { data: codeRecord, error: codeErr } = await supabase
        .from("access_codes")
        .insert({
          event_id: event.id,
          code: accessCode,
          board_member_name: name,
        })
        .select()
        .single();

      if (codeErr) {
        result.errors.push({ row: i + 1, message: `Code error: ${codeErr.message}` });
        continue;
      }

      // Create auth user
      const email = `${accessCode.toLowerCase()}@${SYNTHETIC_EMAIL_DOMAIN}`;
      const { data: newUser, error: userErr } = await admin.auth.admin.createUser({
        email,
        password: accessCode,
        email_confirm: true,
        user_metadata: { role: "board_member", full_name: name },
      });

      if (userErr || !newUser.user) {
        result.errors.push({ row: i + 1, message: `User creation: ${userErr?.message || "unknown"}` });
        continue;
      }

      // Create board member (with directory fields from CSV row)
      const bmFields = extractBoardMemberFields(row);
      const { data: bm, error: bmErr } = await admin
        .from("board_members")
        .insert({
          event_id: event.id,
          user_id: newUser.user.id,
          access_code_id: codeRecord.id,
          name,
          email,
          ...bmFields,
        })
        .select()
        .single();

      if (bmErr || !bm) {
        result.errors.push({ row: i + 1, message: `Board member: ${bmErr?.message || "unknown"}` });
        continue;
      }

      // Link access code
      await admin
        .from("access_codes")
        .update({ board_member_id: bm.id, is_used: true })
        .eq("id", codeRecord.id);

      // Create self party member + itinerary
      const { data: pm } = await admin
        .from("party_members")
        .insert({ board_member_id: bm.id, name, relationship: "self" })
        .select()
        .single();

      if (pm) {
        const itineraryFields = extractItineraryFields(row);
        if (Object.keys(itineraryFields).length > 0) {
          // Validate itinerary fields against schema
          const { itinerarySchema } = await import("@/lib/validations/itinerary");
          const parsed = itinerarySchema.partial().safeParse(itineraryFields);
          await admin.from("itineraries").insert({
            party_member_id: pm.id,
            board_member_id: bm.id,
            event_id: event.id,
            ...(parsed.success ? parsed.data : {}),
          });
        } else {
          await admin.from("itineraries").insert({
            party_member_id: pm.id,
            board_member_id: bm.id,
            event_id: event.id,
          });
        }
      }

      result.created++;
    } catch (err) {
      result.errors.push({
        row: i + 1,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  revalidatePath("/admin/members");
  revalidatePath("/admin/access-codes");
  revalidatePath("/admin");
  return result;
}

function extractBoardMemberFields(row: Record<string, unknown>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  const trimStr = (v: unknown): string | null => {
    if (typeof v !== "string") return null;
    const s = v.trim();
    return s === "" ? null : s;
  };

  const phone = trimStr(row.phone);
  if (phone) fields.phone = phone;

  const contactEmailRaw = trimStr(row.contact_email);
  if (contactEmailRaw) {
    // Split on comma/semicolon, normalize, drop malformed (no @), dedupe.
    const seen = new Set<string>();
    const emails: string[] = [];
    for (const part of contactEmailRaw.split(/[,;]/)) {
      const e = part.trim().toLowerCase();
      if (!e || !e.includes("@") || seen.has(e)) continue;
      seen.add(e);
      emails.push(e);
    }
    if (emails.length > 0) fields.contact_emails = emails;
  }

  const country = trimStr(row.country);
  if (country) fields.country = country;

  const city = trimStr(row.city);
  if (city) fields.city = city;

  const language = trimStr(row.language);
  if (language) fields.language = language;

  const ministry = trimStr(row.ministry);
  if (ministry) fields.ministry = ministry;

  const yearStr = trimStr(row.year_joined);
  if (yearStr) {
    const n = parseInt(yearStr, 10);
    if (!Number.isNaN(n) && n >= 1900 && n <= 2100) fields.year_joined = n;
  }

  return fields;
}

function extractItineraryFields(row: Record<string, unknown>): Record<string, unknown> {
  const ITINERARY_KEYS = new Set([
    "arrival_date", "arrival_airline", "arrival_flight_number", "arrival_time", "arrival_airport",
    "departure_date", "departure_airline", "departure_flight_number", "departure_time", "departure_airport",
    "hotel_preference", "room_type", "check_in_date", "check_out_date", "special_requests",
    "attending_conference", "conference_days",
    "airport_pickup_needed", "airport_dropoff_needed", "transport_notes",
    "passport_name", "passport_number", "visa_required", "visa_status",
    "emergency_contact_name", "emergency_contact_phone",
  ]);

  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (ITINERARY_KEYS.has(key) && value !== undefined && value !== "") {
      fields[key] = value;
    }
  }
  return fields;
}
