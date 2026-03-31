"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid();

export async function getMyBoardMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("board_members")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function getItinerary(partyMemberId: string) {
  if (!uuidSchema.safeParse(partyMemberId).success) return { error: "Invalid ID" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("itineraries")
    .select("*")
    .eq("party_member_id", partyMemberId)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function getSelfItinerary() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: boardMember } = await supabase
    .from("board_members")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!boardMember) return { error: "Board member not found" };

  const { data: partyMember } = await supabase
    .from("party_members")
    .select("id")
    .eq("board_member_id", boardMember.id)
    .eq("relationship", "self")
    .single();

  if (!partyMember) return { error: "Self party member not found" };

  const { data, error } = await supabase
    .from("itineraries")
    .select("*")
    .eq("party_member_id", partyMember.id)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function updateItineraryFields(
  itineraryId: string,
  fields: Record<string, unknown>
) {
  if (!uuidSchema.safeParse(itineraryId).success) return { error: "Invalid ID" };

  const { itinerarySchema } = await import("@/lib/validations/itinerary");

  // Validate fields against schema — only allow known itinerary fields
  const parseResult = itinerarySchema.partial().safeParse(fields);
  if (!parseResult.success) {
    return { error: "Invalid field data" };
  }

  // Strip computed and system fields — defense-in-depth
  const SYSTEM_FIELDS = new Set(["completion_pct", "id", "party_member_id", "board_member_id", "event_id", "created_at", "updated_at"]);
  const safeData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parseResult.data as Record<string, unknown>)) {
    if (!SYSTEM_FIELDS.has(key)) safeData[key] = value;
  }

  if (Object.keys(safeData).length === 0) {
    return { error: "No valid fields to update" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("itineraries")
    .update(safeData)
    .eq("id", itineraryId)
    .select("completion_pct")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/member");
  revalidatePath("/member/itinerary");
  revalidatePath("/member/party");

  return { data: { completion_pct: Number(data.completion_pct) } };
}
