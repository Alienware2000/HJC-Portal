import { getRecentActivity } from "@/actions/members";
import { ActivityFeed } from "@/components/admin/activity-feed";

export const metadata = { title: "Activity — Healing Jesus Conference" };

export default async function ActivityPage() {
  const { data: entries } = await getRecentActivity(100);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">Activity</h2>
        <p className="text-sm text-gray-500 mt-1">All itinerary changes across board members.</p>
      </div>
      <ActivityFeed entries={entries} />
    </div>
  );
}
