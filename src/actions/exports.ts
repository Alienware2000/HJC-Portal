"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveEvent } from "@/actions/members";

interface ExportRow {
  board_member_name: string;
  access_code: string;
  party_member_name: string;
  relationship: string;
  [key: string]: unknown;
}

async function fetchAllData(): Promise<ExportRow[]> {
  const supabase = await createClient();

  // Verify admin role via profiles table (authoritative source)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") return [];

  const event = await getActiveEvent();
  if (!event) return [];

  const { data, error } = await supabase
    .from("board_members")
    .select("*, access_codes!board_members_access_code_id_fkey(code), party_members(*, itineraries(*))")
    .eq("event_id", event.id)
    .order("name");

  if (error || !data) return [];

  const rows: ExportRow[] = [];
  for (const bm of data) {
    const code = Array.isArray(bm.access_codes)
      ? bm.access_codes[0]?.code
      : bm.access_codes?.code || "";
    const partyMembers = Array.isArray(bm.party_members) ? bm.party_members : [];

    for (const pm of partyMembers) {
      const itineraries = Array.isArray(pm.itineraries)
        ? pm.itineraries
        : pm.itineraries
          ? [pm.itineraries]
          : [];
      const it = itineraries[0] || {};

      rows.push({
        board_member_name: bm.name,
        access_code: code,
        board_member_email: bm.email || "",
        board_member_phone: bm.phone || "",
        party_member_name: pm.name,
        relationship: pm.relationship,
        ...it,
      });
    }
  }
  return rows;
}

export async function getFullExportData() {
  return fetchAllData();
}

export async function getRoomingData() {
  const all = await fetchAllData();
  return all.filter((r) => r.hotel_preference);
}

export async function getPickupData() {
  const all = await fetchAllData();
  return all.filter((r) => r.arrival_date || r.airport_pickup_needed);
}
