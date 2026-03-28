import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard — Healing Jesus Conference" };

export default async function MemberDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const firstName = (user.user_metadata?.full_name || "Member").split(" ")[0];

  const { data: boardMember } = await supabase
    .from("board_members")
    .select("id, completion_pct, party_members(id)")
    .eq("user_id", user.id)
    .single();

  if (!boardMember) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-gray-500">Your profile is being set up. Please refresh in a moment.</p>
      </div>
    );
  }

  const completion = Number(boardMember.completion_pct) || 0;
  const partyCount = Array.isArray(boardMember.party_members) ? boardMember.party_members.length : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">
          Hello, {firstName} <span className="inline-block ml-0.5">👋</span>
        </h2>
        <p className="text-sm text-gray-500 mt-1">Manage your conference itinerary and party members.</p>
      </div>

      {/* Progress */}
      <div className="rounded-xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-900">Overall Progress</p>
          <span className="text-sm font-bold text-gray-900 tabular-nums">{Math.round(completion)}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${completion >= 67 ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${completion}%` }} />
        </div>
      </div>

      {/* Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/member/itinerary" className="group rounded-xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_4px_8px_rgba(0,0,0,0.07),0_24px_48px_rgba(0,0,0,0.09)] transition-all hover:-translate-y-0.5">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
            <ClipboardList className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-sm font-semibold text-gray-900">My Itinerary</p>
          <p className="text-[13px] text-gray-400 mt-1">Fill in your travel and accommodation details</p>
        </Link>
        <Link href="/member/party" className="group rounded-xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_4px_8px_rgba(0,0,0,0.07),0_24px_48px_rgba(0,0,0,0.09)] transition-all hover:-translate-y-0.5">
          <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-sm font-semibold text-gray-900">My Party</p>
          <p className="text-[13px] text-gray-400 mt-1">{partyCount} member{partyCount !== 1 ? "s" : ""} in your party</p>
        </Link>
      </div>
    </div>
  );
}
