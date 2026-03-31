import { redirect } from "next/navigation";
import { Users, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMembers, getDashboardStats } from "@/actions/members";
import { MembersTable } from "@/components/admin/members-table";

export const metadata = { title: "Staff Dashboard — Healing Jesus Conference" };

export default async function StaffDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const firstName = (user.user_metadata?.full_name || "Staff").split(" ")[0];

  const [{ data: members }, stats] = await Promise.all([getMembers(), getDashboardStats()]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg sm:text-[22px] font-bold text-gray-900 tracking-tight">
          Hello, {firstName} <span className="inline-block ml-0.5">👋</span>
        </h2>
        <p className="text-sm text-gray-500 mt-1">Search and view board member information.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative overflow-hidden rounded-xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Members</p>
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center"><Users className="h-4 w-4 text-blue-600" /></div>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-none tabular-nums">{stats.totalMembers}</p>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Completion</p>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center"><BarChart3 className="h-4 w-4 text-emerald-600" /></div>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-none tabular-nums">{stats.avgCompletion}%</p>
        </div>
      </div>

      {members.length > 0 ? (
        <MembersTable members={members} basePath="/staff/members" />
      ) : (
        <div className="rounded-xl bg-white py-16 text-center shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)]">
          <div className="mx-auto h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
            <Users className="h-5 w-5 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-900">No members yet</p>
          <p className="text-[13px] text-gray-400 mt-1 max-w-xs mx-auto">Board members will appear here once the admin generates access codes and members log in.</p>
        </div>
      )}
    </div>
  );
}
