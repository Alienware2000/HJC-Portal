import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, KeyRound, BarChart3, Activity, ArrowRight, TrendingUp, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats, getRecentActivity, getCompletionDistribution } from "@/actions/members";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { FIELD_LABELS } from "@/lib/validations/itinerary";

export const metadata = { title: "Admin Dashboard — Healing Jesus Conference" };

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const firstName = (user.user_metadata?.full_name || "Admin").split(" ")[0];
  const [stats, { data: recentActivity }, distribution] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(6),
    getCompletionDistribution(),
  ]);

  const { buckets, needsAttention } = distribution;
  const maxBucket = Math.max(...buckets.map((b) => b.count), 1);
  const codeUsageRate = stats.totalAccessCodes > 0 ? Math.round((stats.usedAccessCodes / stats.totalAccessCodes) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">
          Hello, {firstName} <span className="inline-block ml-0.5">👋</span>
        </h2>
        <p className="text-sm text-gray-500 mt-1">Here&apos;s what&apos;s happening with the conference.</p>
      </div>

      {/* Stats row — 4 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Board Members"
          value={stats.totalMembers}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          footer={stats.totalMembers > 0 ? (
            <span className="flex items-center gap-1 text-emerald-600"><TrendingUp className="h-3 w-3" />{stats.usedAccessCodes} registered</span>
          ) : null}
        />
        <StatCard
          label="Access Codes"
          value={stats.totalAccessCodes}
          icon={KeyRound}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
          footer={stats.totalAccessCodes > 0 ? (
            <span className="text-gray-500">{codeUsageRate}% used ({stats.usedAccessCodes}/{stats.totalAccessCodes})</span>
          ) : null}
        />
        <StatCard
          label="Avg Completion"
          value={`${stats.avgCompletion}%`}
          icon={BarChart3}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
          footer={stats.totalMembers > 0 ? (
            <span className="text-gray-500">across {stats.totalMembers} member{stats.totalMembers !== 1 ? "s" : ""}</span>
          ) : null}
        />
        <StatCard
          label="Changes (24h)"
          value={stats.recentChanges}
          icon={Activity}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
          footer={stats.recentChanges > 0 ? (
            <Link href="/admin/activity" className="text-blue-600 hover:text-blue-700 font-medium">View activity &rarr;</Link>
          ) : null}
        />
      </div>

      {/* Getting started guidance when no members */}
      {stats.totalMembers === 0 && (
        <div className="rounded-xl bg-white p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)]">
          <h3 className="text-[15px] font-semibold text-gray-900 mb-2">Getting Started</h3>
          <p className="text-sm text-gray-500 mb-4">No board members yet. Here&apos;s how to get started:</p>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2.5">
              <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
              <span className="text-gray-700">Go to <Link href="/admin/access-codes" className="text-blue-600 font-medium hover:underline">Access Codes</Link> and generate codes for your board members</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
              <span className="text-gray-700">Share the codes — members log in and fill their itinerary</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center shrink-0">3</span>
              <span className="text-gray-700">Or <Link href="/admin/imports" className="text-blue-600 font-medium hover:underline">import a CSV</Link> to bulk-create members</span>
            </div>
          </div>
        </div>
      )}

      {/* Middle row: Chart + Needs Attention */}
      {stats.totalMembers > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Completion chart */}
          <div className="lg:col-span-3 rounded-xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[15px] font-semibold text-gray-900">Completion Overview</h3>
                <p className="text-xs text-gray-400 mt-0.5">Itinerary completion distribution across members</p>
              </div>
              <Link href="/admin/members" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                View all &rarr;
              </Link>
            </div>
            <div className="flex items-end gap-2 h-[140px]">
              {buckets.map((bucket) => (
                <div key={bucket.range} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-gray-700 tabular-nums">{bucket.count}</span>
                  <div className="w-full rounded-t-md transition-all duration-500" style={{
                    height: `${Math.max((bucket.count / maxBucket) * 100, bucket.count > 0 ? 8 : 2)}%`,
                    backgroundColor: bucket.color,
                    minHeight: bucket.count > 0 ? "6px" : "2px",
                  }} />
                  <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{bucket.range}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Needs attention */}
          <div className="lg:col-span-2 rounded-xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-gray-900">Needs Attention</h3>
                <p className="text-[11px] text-gray-400">Members with 0% completion</p>
              </div>
            </div>
            {needsAttention.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-gray-400">All members have started their itineraries.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {needsAttention.map((member) => (
                  <Link
                    key={member.id}
                    href={`/admin/members/${member.id}`}
                    className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-gray-500">{member.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}</span>
                      </div>
                      <span className="text-sm text-gray-700">{member.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-300 tabular-nums">0%</span>
                  </Link>
                ))}
                {needsAttention.length >= 5 && (
                  <Link href="/admin/members" className="block text-center text-xs text-blue-600 hover:text-blue-700 font-medium pt-2">
                    View all members &rarr;
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity table */}
      <div className="rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-[15px] font-semibold text-gray-900">Recent Activity</h3>
          <Link href="/admin/activity" className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recentActivity.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">
            No activity yet. Changes will appear here as members update itineraries.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Fields Changed</th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Details</th>
                <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentActivity.map((entry: { id: string; changes: Record<string, { old: unknown; new: unknown }>; created_at: string }) => {
                const changedFields = Object.keys(entry.changes || {});
                const firstField = changedFields[0];
                const label = firstField ? (FIELD_LABELS[firstField] || firstField) : "Unknown";
                const timeAgo = new Date(entry.created_at);
                const timeStr = timeAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + timeAgo.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

                return (
                  <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-sm text-gray-900 font-medium">
                          {label}
                        </span>
                        {changedFields.length > 1 && (
                          <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            +{changedFields.length - 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      {firstField && entry.changes[firstField] && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="text-gray-400 line-through max-w-[80px] truncate">{String(entry.changes[firstField].old || "empty")}</span>
                          <span className="text-gray-300">&rarr;</span>
                          <span className="text-gray-700 font-medium max-w-[120px] truncate">{String(entry.changes[firstField].new || "empty")}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-xs text-gray-400 whitespace-nowrap">{timeStr}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* Stat Card Component */
function StatCard({ label, value, icon: Icon, iconBg, iconColor, footer }: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-medium text-gray-400">{label}</p>
        <div className={`h-8 w-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>
      <p className="text-[28px] font-bold text-gray-900 tracking-tight leading-none tabular-nums">{value}</p>
      {footer && (
        <p className="text-[11px] mt-2.5 flex items-center gap-1">
          {footer}
        </p>
      )}
    </div>
  );
}
