"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { deletePartyMember } from "@/actions/party";

interface PartyMemberCardProps { id: string; name: string; relationship: string; completionPct: number; isSelf: boolean; }

export function PartyMemberCard({ id, name, relationship, completionPct, isSelf }: PartyMemberCardProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const itineraryHref = isSelf ? "/member/itinerary" : `/member/party/${id}`;
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const pctColor = completionPct >= 67 ? "bg-emerald-500" : "bg-blue-500";

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Remove ${name}?`)) return;
    startTransition(async () => {
      const result = await deletePartyMember(id);
      if (result.error) toast.error(result.error);
      else { toast.success(`${name} removed`); router.refresh(); }
    });
  };

  return (
    <div
      tabIndex={0}
      role="link"
      aria-label={`Edit ${name}'s itinerary`}
      className="group rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_4px_8px_rgba(0,0,0,0.07),0_24px_48px_rgba(0,0,0,0.09)] transition-all duration-200 hover:-translate-y-0.5 cursor-pointer overflow-hidden focus-visible:ring-2 focus-visible:ring-ring/50 focus:outline-none"
      onClick={() => router.push(itineraryHref)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(itineraryHref); } }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isSelf ? "bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_2px_6px_rgba(37,99,235,0.25)]" : "bg-gray-200"}`}>
              <span className={`text-[10px] font-bold ${isSelf ? "text-white" : "text-gray-500"}`}>{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
              <p className="text-xs text-gray-400 capitalize">
                {relationship}
                {isSelf && <span className="ml-1 text-[10px] bg-blue-50 text-blue-600 px-1 rounded font-medium">you</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!isSelf && (
              <button onClick={handleDelete} disabled={isPending} aria-label={`Remove ${name}`} className="p-2 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:opacity-100 transition-all">
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </button>
            )}
            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
            <div className={`h-full rounded-full ${pctColor} transition-all duration-500 relative overflow-hidden`} style={{ width: `${completionPct}%` }}>
              <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" />
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-500 tabular-nums">{Math.round(completionPct)}%</span>
        </div>
      </div>
    </div>
  );
}
