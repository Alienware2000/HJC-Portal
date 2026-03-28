"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getPartyMembers(boardMemberId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("party_members")
    .select("*, itineraries(completion_pct)")
    .eq("board_member_id", boardMemberId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  return { data: data || [] };
}

export async function addPartyMember(
  boardMemberId: string,
  name: string,
  relationship: string
) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get the event_id from the board member
  const { data: bm } = await supabase
    .from("board_members")
    .select("event_id")
    .eq("id", boardMemberId)
    .single();

  if (!bm) return { error: "Board member not found" };

  // Create party member
  const { data: partyMember, error: pmError } = await supabase
    .from("party_members")
    .insert({ board_member_id: boardMemberId, name, relationship })
    .select()
    .single();

  if (pmError || !partyMember) return { error: pmError?.message || "Failed to add" };

  // Create itinerary for the party member
  await admin.from("itineraries").insert({
    party_member_id: partyMember.id,
    board_member_id: boardMemberId,
    event_id: bm.event_id,
  });

  revalidatePath("/member/party");
  return { data: partyMember };
}

export async function deletePartyMember(partyMemberId: string) {
  const supabase = await createClient();

  // Prevent deleting self
  const { data: pm } = await supabase
    .from("party_members")
    .select("relationship")
    .eq("id", partyMemberId)
    .single();

  if (!pm) return { error: "Party member not found" };
  if (pm.relationship === "self") return { error: "Cannot remove yourself" };

  const { error } = await supabase
    .from("party_members")
    .delete()
    .eq("id", partyMemberId);

  if (error) return { error: error.message };

  revalidatePath("/member/party");
  return { success: true };
}
