import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PartyMemberCard } from "@/components/party/party-member-card";
import { AddPartyMemberDialog } from "@/components/party/add-party-member-dialog";

export const metadata = { title: "My Party — Healing Jesus Conference" };

export default async function PartyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: boardMember } = await supabase
    .from("board_members")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!boardMember) return <p className="text-sm text-gray-500 py-16 text-center">Board member not found.</p>;

  const { data: partyMembers } = await supabase
    .from("party_members")
    .select("*, itineraries(completion_pct)")
    .eq("board_member_id", boardMember.id)
    .order("created_at", { ascending: true });

  const members = partyMembers || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">My Party</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your family members and guests.</p>
        </div>
        <AddPartyMemberDialog boardMemberId={boardMember.id} />
      </div>

      {members.length === 0 ? (
        <div className="rounded-xl bg-white py-16 text-center shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)]">
          <div className="mx-auto h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
            <Users className="h-5 w-5 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-900">No party members yet</p>
          <p className="text-[13px] text-gray-400 mt-1">Add family members or guests to manage their itineraries.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((pm) => {
            const itineraries = Array.isArray(pm.itineraries) ? pm.itineraries : pm.itineraries ? [pm.itineraries] : [];
            const completionPct = Number(itineraries[0]?.completion_pct ?? 0);
            return (
              <PartyMemberCard
                key={pm.id}
                id={pm.id}
                name={pm.name}
                relationship={pm.relationship}
                completionPct={completionPct}
                isSelf={pm.relationship === "self"}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
