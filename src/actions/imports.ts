"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SYNTHETIC_EMAIL_DOMAIN } from "@/lib/constants";
import { itinerarySchema } from "@/lib/validations/itinerary";

interface ImportRow {
  board_member_name: string;
  access_code?: string;
  [key: string]: unknown;
}

interface ImportError {
  row: number;
  message: string;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: ImportError[];
}

export interface ImportProgress {
  created: number;
  updated: number;
  skipped: number;
  errorCount: number;
  total: number;
  current: string | null;
  elapsedMs: number;
}

const MAX_IMPORT_ROWS = 1000;
const BATCH_SIZE = 5;
const nameSchema = z.string().min(2).max(200).trim();

type AdminClient = ReturnType<typeof createAdminClient>;
type RowOutcome =
  | { kind: "created" }
  | { kind: "updated" }
  | { kind: "skipped" }
  | { kind: "error"; message: string };

export async function importMembers(rows: ImportRow[]): Promise<ImportResult> {
  return importMembersStream(rows);
}

/**
 * Run the import. If `onProgress` is provided, it is called after each batch
 * of {@link BATCH_SIZE} rows so the caller can stream live updates.
 */
export async function importMembersStream(
  rows: ImportRow[],
  onProgress?: (p: ImportProgress) => void
): Promise<ImportResult> {
  const startedAt = Date.now();
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  const emit = (current: string | null) => {
    onProgress?.({
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      errorCount: result.errors.length,
      total: rows.length,
      current,
      elapsedMs: Date.now() - startedAt,
    });
  };

  if (rows.length > MAX_IMPORT_ROWS) {
    result.errors.push({ row: 0, message: `Too many rows (max ${MAX_IMPORT_ROWS})` });
    emit(null);
    return result;
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  // Verify caller is admin via profiles table (authoritative source).
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    result.errors.push({ row: 0, message: "Unauthorized" });
    emit(null);
    return result;
  }
  const { data: callerProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!callerProfile || callerProfile.role !== "admin") {
    result.errors.push({ row: 0, message: "Unauthorized" });
    emit(null);
    return result;
  }

  // Active event lookup via admin client (independent of caller's RLS).
  const { data: event } = await admin
    .from("events")
    .select("id, year")
    .eq("is_active", true)
    .single();

  if (!event) {
    result.errors.push({
      row: 0,
      message: "No active conference event. Open the admin dashboard to set one up first.",
    });
    emit(null);
    return result;
  }

  // Process in parallel batches.
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const slice = rows.slice(i, i + BATCH_SIZE);
    const settled = await Promise.allSettled(
      slice.map((row, idx) => processRow(row, i + idx, event.id, event.year, admin))
    );

    let lastNameInBatch: string | null = null;
    for (let j = 0; j < settled.length; j++) {
      const rowIndex = i + j + 1;
      const settlement = settled[j];
      const rawName = slice[j].board_member_name;
      if (typeof rawName === "string" && rawName.trim()) lastNameInBatch = rawName.trim();

      if (settlement.status === "rejected") {
        result.errors.push({
          row: rowIndex,
          message: settlement.reason instanceof Error ? settlement.reason.message : "Unknown error",
        });
        continue;
      }

      const outcome = settlement.value;
      switch (outcome.kind) {
        case "created":
          result.created++;
          break;
        case "updated":
          result.updated++;
          break;
        case "skipped":
          result.skipped++;
          break;
        case "error":
          result.errors.push({ row: rowIndex, message: outcome.message });
          break;
      }
    }

    emit(lastNameInBatch);
  }

  revalidatePath("/admin/members");
  revalidatePath("/admin/access-codes");
  revalidatePath("/admin");

  return result;
}

async function processRow(
  row: ImportRow,
  index: number,
  eventId: string,
  eventYear: number,
  admin: AdminClient
): Promise<RowOutcome> {
  void index;
  const rawName = row.board_member_name?.toString().trim();
  const nameResult = nameSchema.safeParse(rawName);
  if (!nameResult.success) {
    return { kind: "error", message: "Invalid or missing board member name (2-200 chars)" };
  }
  const name = nameResult.data;

  try {
    const providedCode = row.access_code?.toString().trim().toUpperCase();

    // If a specific access_code was provided, check whether it already maps
    // to a board_member — that's the re-import / update path.
    if (providedCode) {
      const { data: existing } = await admin
        .from("access_codes")
        .select("id, is_used, board_member_id")
        .eq("event_id", eventId)
        .eq("code", providedCode)
        .maybeSingle();

      if (existing?.is_used && existing.board_member_id) {
        const bmFields = extractBoardMemberFields(row);
        const itineraryFields = extractItineraryFields(row);
        let didUpdate = false;
        if (Object.keys(bmFields).length > 0) {
          await admin.from("board_members").update(bmFields).eq("id", existing.board_member_id);
          didUpdate = true;
        }
        if (Object.keys(itineraryFields).length > 0) {
          const parsed = itinerarySchema.partial().safeParse(itineraryFields);
          if (parsed.success && Object.keys(parsed.data).length > 0) {
            await admin
              .from("itineraries")
              .update(parsed.data)
              .eq("board_member_id", existing.board_member_id);
            didUpdate = true;
          }
        }
        return didUpdate ? { kind: "updated" } : { kind: "skipped" };
      }
    }

    // Generate (or reuse) the access code via atomic insert + retry on collision.
    const seedCode =
      providedCode ??
      `${name.split(/\s+/).pop()!.toUpperCase()}-${eventYear}`;
    const insertedCode = await insertAccessCodeWithRetry(admin, eventId, name, seedCode);
    if (!insertedCode.ok) {
      return { kind: "error", message: `Code error: ${insertedCode.error}` };
    }
    const codeRecord = insertedCode.value;

    // Create the auth user (synthetic email; password = code).
    const email = `${codeRecord.code.toLowerCase()}@${SYNTHETIC_EMAIL_DOMAIN}`;
    const { data: newUser, error: userErr } = await admin.auth.admin.createUser({
      email,
      password: codeRecord.code,
      email_confirm: true,
      user_metadata: { role: "board_member", full_name: name },
    });

    if (userErr || !newUser.user) {
      return { kind: "error", message: `User creation: ${userErr?.message ?? "unknown"}` };
    }

    const bmFields = extractBoardMemberFields(row);
    const { data: bm, error: bmErr } = await admin
      .from("board_members")
      .insert({
        event_id: eventId,
        user_id: newUser.user.id,
        access_code_id: codeRecord.id,
        name,
        email,
        ...bmFields,
      })
      .select("id")
      .single();

    if (bmErr || !bm) {
      return { kind: "error", message: `Board member: ${bmErr?.message ?? "unknown"}` };
    }

    // Link the code to the board member and mark as used.
    await admin
      .from("access_codes")
      .update({ board_member_id: bm.id, is_used: true })
      .eq("id", codeRecord.id);

    // Create the self party_member + itinerary stub.
    const { data: pm } = await admin
      .from("party_members")
      .insert({ board_member_id: bm.id, name, relationship: "self" })
      .select("id")
      .single();

    if (pm) {
      const itineraryFields = extractItineraryFields(row);
      const parsed = itinerarySchema.partial().safeParse(itineraryFields);
      await admin.from("itineraries").insert({
        party_member_id: pm.id,
        board_member_id: bm.id,
        event_id: eventId,
        ...(parsed.success ? parsed.data : {}),
      });
    }

    return { kind: "created" };
  } catch (err) {
    return { kind: "error", message: err instanceof Error ? err.message : "Unknown error" };
  }
}

async function insertAccessCodeWithRetry(
  admin: AdminClient,
  eventId: string,
  name: string,
  seedCode: string
): Promise<
  | { ok: true; value: { id: string; code: string } }
  | { ok: false; error: string }
> {
  let code = seedCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await admin
      .from("access_codes")
      .insert({ event_id: eventId, code, board_member_name: name })
      .select("id, code")
      .single();

    if (!error && data) return { ok: true, value: data };
    // 23505 = unique_violation. Retry with a random suffix.
    if (error?.code === "23505") {
      const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
      code = `${seedCode}-${suffix}`;
      continue;
    }
    return { ok: false, error: error?.message ?? "unknown" };
  }
  return { ok: false, error: "Could not generate a unique access code after 5 attempts" };
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
