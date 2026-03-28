"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid();

export async function getActiveEvent() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("id, year, name")
    .eq("is_active", true)
    .single();
  return data;
}

export async function getMembers() {
  const supabase = await createClient();
  const event = await getActiveEvent();
  if (!event) return { data: [], error: "No active event" };

  const { data, error } = await supabase
    .from("board_members")
    .select("*, access_codes!board_members_access_code_id_fkey(code), party_members(id)")
    .eq("event_id", event.id)
    .order("name", { ascending: true });

  if (error) return { data: [], error: error.message };

  const members = (data || []).map((m) => ({
    ...m,
    access_code: Array.isArray(m.access_codes)
      ? m.access_codes[0]?.code
      : m.access_codes?.code || null,
    party_count: Array.isArray(m.party_members)
      ? m.party_members.length
      : 0,
  }));

  return { data: members };
}

export async function getMemberDetail(memberId: string) {
  if (!uuidSchema.safeParse(memberId).success) return { error: "Invalid ID" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("board_members")
    .select("*, party_members(*, itineraries(*)), access_codes!board_members_access_code_id_fkey(code)")
    .eq("id", memberId)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function getDashboardStats() {
  const supabase = await createClient();
  const event = await getActiveEvent();
  if (!event)
    return {
      totalMembers: 0,
      totalAccessCodes: 0,
      usedAccessCodes: 0,
      avgCompletion: 0,
      recentChanges: 0,
    };

  const [membersRes, codesRes, usedCodesRes, completionRes, changesRes] =
    await Promise.all([
      supabase
        .from("board_members")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id),
      supabase
        .from("access_codes")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id),
      supabase
        .from("access_codes")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id)
        .eq("is_used", true),
      supabase
        .from("board_members")
        .select("completion_pct")
        .eq("event_id", event.id),
      supabase
        .from("change_log")
        .select("id", { count: "exact", head: true })
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        ),
    ]);

  const completions = completionRes.data || [];
  const avgCompletion =
    completions.length > 0
      ? completions.reduce((sum, m) => sum + Number(m.completion_pct), 0) /
        completions.length
      : 0;

  return {
    totalMembers: membersRes.count || 0,
    totalAccessCodes: codesRes.count || 0,
    usedAccessCodes: usedCodesRes.count || 0,
    avgCompletion: Math.round(avgCompletion),
    recentChanges: changesRes.count || 0,
  };
}

export async function getRecentActivity(limit = 20) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("change_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { data: [] };
  return { data: data || [] };
}
