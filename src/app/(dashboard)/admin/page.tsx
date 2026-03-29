import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, KeyRound, BarChart3, Activity, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats, getRecentActivity } from "@/actions/members";
import { ActivityFeed } from "@/components/admin/activity-feed";

export const metadata = { title: "Admin Dashboard — Healing Jesus Conference" };

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const firstName = (user.user_metadata?.full_name || "Admin").split(" ")[0];
  const [stats, { data: recentActivity }] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(8),
  ]);

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">
          Hello, {firstName} <span className="inline-block ml-0.5">👋</span>
        </h2>
        <p className="text-sm text-gray-500 mt-1">Here&apos;s what&apos;s happening with the conference.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Current Members" value={stats.totalMembers} icon={Users} color="blue" />
        <Stat label="Access Codes" value={stats.totalAccessCodes} sub={`${stats.usedAccessCodes} used`} icon={KeyRound} color="amber" />
        <Stat label="Avg Completion" value={`${stats.avgCompletion}%`} icon={BarChart3} color="emerald" />
        <Stat label="Changes (24h)" value={stats.recentChanges} icon={Activity} color="purple" />
      </div>

      {/* Getting started guidance when no members */}
      {stats.totalMembers === 0 && (
        <div className="rounded-xl bg-white p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)]">
          <h3 className="text-[15px] font-semibold text-gray-900 mb-2">Getting Started</h3>
          <p className="text-sm text-gray-500 mb-4">No board members yet. Here&apos;s how to get started:</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2.5">
              <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
              <span className="text-gray-700">Go to <Link href="/admin/access-codes" className="text-blue-600 font-medium hover:underline">Access Codes</Link> and generate codes for your board members</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
              <span className="text-gray-700">Share the codes — members log in and fill their itinerary</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
              <span className="text-gray-700">Or <Link href="/admin/imports" className="text-blue-600 font-medium hover:underline">import a CSV</Link> to bulk-create members</span>
            </div>
          </div>
        </div>
      )}

      {/* Activity section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-gray-900">Latest Updates</h3>
          <Link href="/admin/activity" className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ActivityFeed entries={recentActivity} />
      </div>
    </div>
  );
}

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-500" },
  amber: { bg: "bg-amber-50", text: "text-amber-500" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-500" },
};

function Stat({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ComponentType<{ className?: string }>; color: string;
}) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className="rounded-xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-medium text-gray-400">{label}</p>
        <div className={`h-8 w-8 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${c.text}`} />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 tracking-tight leading-none tabular-nums">{value}</p>
      {sub && (
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {sub}
        </p>
      )}
    </div>
  );
}
