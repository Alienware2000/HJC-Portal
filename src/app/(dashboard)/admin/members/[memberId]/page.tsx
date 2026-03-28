import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, KeyRound } from "lucide-react";
import { getMemberDetail } from "@/actions/members";
import { CompletionBadge } from "@/components/admin/completion-badge";
import { FIELD_LABELS } from "@/lib/validations/itinerary";

export const metadata = { title: "Member Details — Healing Jesus Conference" };

export default async function MemberDetailPage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  const { data: member, error } = await getMemberDetail(memberId);
  if (error || !member) notFound();

  const accessCode = Array.isArray(member.access_codes) ? member.access_codes[0]?.code : member.access_codes?.code;
  const partyMembers = Array.isArray(member.party_members) ? member.party_members : [];
  const initial = member.name.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      <Link href="/admin/members" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Members
      </Link>

      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.25)] shrink-0">
            <span className="text-[22px] font-bold text-white">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900">{member.name}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
              {member.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {member.email}</span>}
              {member.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {member.phone}</span>}
              {accessCode && <span className="flex items-center gap-1"><KeyRound className="h-3 w-3" /> <code className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{accessCode}</code></span>}
            </div>
          </div>
          <CompletionBadge pct={Number(member.completion_pct)} />
        </div>
      </div>

      {/* Party */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Party Members ({partyMembers.length})</h3>
        <div className="space-y-3">
          {partyMembers.map((pm: Record<string, unknown>) => {
            const itineraries = Array.isArray(pm.itineraries) ? pm.itineraries : pm.itineraries ? [pm.itineraries] : [];
            const it = itineraries[0] as Record<string, unknown> | undefined;
            return (
              <div key={pm.id as string} className="relative overflow-hidden rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)]">
                <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-gray-500">{(pm.name as string).charAt(0)}</span>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-900">{pm.name as string}</span>
                      <span className="ml-2 text-[13px] text-gray-400 capitalize">{pm.relationship as string}</span>
                    </div>
                  </div>
                  {it && <CompletionBadge pct={Number(it.completion_pct ?? 0)} />}
                </div>
                {it && (
                  <div className="px-5 py-4 grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                    {Object.entries(FIELD_LABELS).map(([field, label]) => {
                      const value = it[field];
                      if (value === null || value === undefined || value === "" || value === false) return null;
                      return (
                        <div key={field} className="flex gap-1.5">
                          <span className="text-gray-400 shrink-0">{label}:</span>
                          <span className="text-gray-700 font-medium">{typeof value === "boolean" ? "Yes" : Array.isArray(value) ? value.join(", ") : String(value)}</span>
                        </div>
                      );
                    })}
                    {Object.entries(FIELD_LABELS).every(([f]) => { const v = it[f]; return v === null || v === undefined || v === "" || v === false; }) && (
                      <p className="text-gray-400 italic col-span-full">No itinerary details yet.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
