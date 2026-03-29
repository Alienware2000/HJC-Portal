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

export async function getCompletionDistribution() {
  const supabase = await createClient();
  const event = await getActiveEvent();
  if (!event) return { buckets: [], needsAttention: [] };

  const { data } = await supabase
    .from("board_members")
    .select("id, name, completion_pct")
    .eq("event_id", event.id)
    .order("completion_pct", { ascending: true });

  if (!data || data.length === 0) return { buckets: [], needsAttention: [] };

  const buckets = [
    { range: "0%", count: 0, color: "#d1d5db" },
    { range: "1–25%", count: 0, color: "#93c5fd" },
    { range: "26–50%", count: 0, color: "#60a5fa" },
    { range: "51–75%", count: 0, color: "#f59e0b" },
    { range: "76–99%", count: 0, color: "#fbbf24" },
    { range: "100%", count: 0, color: "#34d399" },
  ];

  for (const m of data) {
    const pct = Number(m.completion_pct);
    if (pct === 0) buckets[0].count++;
    else if (pct <= 25) buckets[1].count++;
    else if (pct <= 50) buckets[2].count++;
    else if (pct <= 75) buckets[3].count++;
    else if (pct < 100) buckets[4].count++;
    else buckets[5].count++;
  }

  const needsAttention = data
    .filter((m) => Number(m.completion_pct) === 0)
    .slice(0, 5)
    .map((m) => ({ id: m.id, name: m.name, completion_pct: Number(m.completion_pct) }));

  return { buckets, needsAttention };
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
