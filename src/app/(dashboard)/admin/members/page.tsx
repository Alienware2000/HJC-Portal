import { getMembers } from "@/actions/members";
import { MembersTable } from "@/components/admin/members-table";

export const metadata = { title: "Members — Healing Jesus Conference" };

export default async function MembersPage() {
  const { data: members } = await getMembers();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">Members</h2>
        <p className="text-sm text-gray-500 mt-1">All registered board members for the current event.</p>
      </div>
      <MembersTable members={members} />
    </div>
  );
}
