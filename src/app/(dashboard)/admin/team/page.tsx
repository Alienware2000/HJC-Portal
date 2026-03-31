import { getTeamMembers } from "@/actions/team";
import { TeamPanel } from "@/components/admin/team-panel";

export const metadata = { title: "Team — Healing Jesus Conference" };

export default async function TeamPage() {
  const { data: members } = await getTeamMembers();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">Team</h2>
        <p className="text-sm text-gray-500 mt-1">Manage staff and admin accounts.</p>
      </div>
      <TeamPanel members={members} />
    </div>
  );
}
