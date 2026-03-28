"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveEvent } from "@/actions/members";

const nameSchema = z.string().min(2, "Name too short").max(200).trim();
const uuidSchema = z.string().uuid();

export async function getAccessCodes() {
  const supabase = await createClient();
  const event = await getActiveEvent();
  if (!event) return { data: [] };

  const { data, error } = await supabase
    .from("access_codes")
    .select("*, board_members!fk_access_codes_board_member(name)")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  if (error) return { data: [] };
  return { data: data || [] };
}

export async function generateAccessCode(boardMemberName: string) {
  const parsed = nameSchema.safeParse(boardMemberName);
  if (!parsed.success) return { error: "Please enter a valid name (2-200 characters)" };

  const supabase = await createClient();
  const event = await getActiveEvent();
  if (!event) return { error: "No active event" };

  // Generate code: LASTNAME-YEAR
  const nameParts = boardMemberName.trim().split(/\s+/);
  const lastName = nameParts[nameParts.length - 1].toUpperCase();
  let code = `${lastName}-${event.year}`;

  // Check if code already exists, add suffix if needed
  const { data: existing } = await supabase
    .from("access_codes")
    .select("code")
    .eq("event_id", event.id)
    .like("code", `${code}%`);

  if (existing && existing.length > 0) {
    code = `${code}-${existing.length + 1}`;
  }

  // Try insert — retry with incremented suffix on unique conflict
  let attempts = 0;
  let data = null;
  let lastError = null;

  while (attempts < 3) {
    const tryCode = attempts === 0 ? code : `${code}-${attempts + 1}`;
    const result = await supabase
      .from("access_codes")
      .insert({
        event_id: event.id,
        code: tryCode,
        board_member_name: boardMemberName.trim(),
      })
      .select()
      .single();

    if (!result.error) {
      data = result.data;
      break;
    }

    // If unique violation, retry with next suffix
    if (result.error.code === "23505") {
      attempts++;
      lastError = result.error;
      continue;
    }

    return { error: result.error.message };
  }

  if (!data) return { error: lastError?.message || "Failed to generate unique code" };

  revalidatePath("/admin/access-codes");
  return { data };
}

export async function deleteAccessCode(codeId: string) {
  if (!uuidSchema.safeParse(codeId).success) return { error: "Invalid ID" };

  const supabase = await createClient();

  // Only delete unused codes
  const { data: code } = await supabase
    .from("access_codes")
    .select("is_used")
    .eq("id", codeId)
    .single();

  if (!code) return { error: "Access code not found" };
  if (code.is_used) return { error: "Cannot delete a used access code" };

  const { error } = await supabase
    .from("access_codes")
    .delete()
    .eq("id", codeId);

  if (error) return { error: error.message };

  revalidatePath("/admin/access-codes");
  return { success: true };
}
