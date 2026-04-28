"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, KeyRound, MapPin, Languages, Building2, Calendar, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { CompletionBadge } from "@/components/admin/completion-badge";
import { FIELD_LABELS } from "@/lib/validations/itinerary";

interface MemberDetailViewProps {
  member: Record<string, unknown>;
  backHref: string;
  backLabel: string;
}

export function MemberDetailView({ member, backHref, backLabel }: MemberDetailViewProps) {
  const accessCode = Array.isArray(member.access_codes)
    ? (member.access_codes as Record<string, string>[])[0]?.code
    : (member.access_codes as Record<string, string> | null)?.code;
  const partyMembers = Array.isArray(member.party_members) ? member.party_members : [];
  const initial = (member.name as string).charAt(0).toUpperCase();

  const contactEmails = Array.isArray(member.contact_emails)
    ? (member.contact_emails as string[])
    : [];
  const country = (member.country as string | null) || null;
  const city = (member.city as string | null) || null;
  const language = (member.language as string | null) || null;
  const ministry = (member.ministry as string | null) || null;
  const yearJoined = member.year_joined as number | null | undefined;
  const phone = (member.phone as string | null) || null;
  const location = [city, country].filter(Boolean).join(", ");
  const hasDirectory = Boolean(location || language || ministry || yearJoined);

  const [copied, setCopied] = useState<string | null>(null);
  const handleCopy = (key: string, value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied((k) => (k === key ? null : k)), 2000);
  };

  return (
    <div className="space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-ring/50 rounded-md px-1 -mx-1 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
      </Link>

      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.25)] shrink-0">
            <span className="text-[22px] font-bold text-white">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">{member.name as string}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1.5 text-sm text-gray-500">
              {contactEmails.length > 0 ? (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {contactEmails.join(", ")}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 italic text-gray-400">
                  <Mail className="h-3.5 w-3.5" /> No contact email provided
                </span>
              )}
              {phone ? (
                <button
                  type="button"
                  onClick={() => handleCopy("phone", phone, "Phone")}
                  className="group/p flex items-center gap-1.5 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors px-1.5 -mx-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                  aria-label={copied === "phone" ? "Phone copied" : `Copy phone ${phone}`}
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span className="tabular-nums">{phone}</span>
                  {copied === "phone" ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3 text-gray-300 group-hover/p:text-gray-500" />
                  )}
                </button>
              ) : null}
              {accessCode ? (
                <button
                  type="button"
                  onClick={() => handleCopy("code", accessCode, "Code")}
                  className="group/c flex items-center gap-1.5 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors px-1.5 -mx-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                  aria-label={copied === "code" ? "Code copied" : `Copy code ${accessCode}`}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <code className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{accessCode}</code>
                  {copied === "code" ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3 text-gray-300 group-hover/c:text-gray-500" />
                  )}
                </button>
              ) : null}
            </div>
            {hasDirectory && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-[13px] text-gray-500">
                {location ? <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {location}</span> : null}
                {language ? <span className="flex items-center gap-1.5"><Languages className="h-3 w-3" /> {language}</span> : null}
                {ministry ? <span className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> {ministry}</span> : null}
                {yearJoined ? <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Joined {yearJoined}</span> : null}
              </div>
            )}
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
                      <span className="ml-2 text-[13px] text-gray-500 capitalize">{pm.relationship as string}</span>
                    </div>
                  </div>
                  {it && <CompletionBadge pct={Number(it.completion_pct ?? 0)} />}
                </div>
                {it && (
                  <div className="px-5 py-4 grid gap-x-4 sm:gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                    {Object.entries(FIELD_LABELS).map(([field, label]) => {
                      const value = it[field];
                      if (value === null || value === undefined || value === "" || value === false) return null;
                      return (
                        <div key={field} className="flex gap-1.5">
                          <span className="text-gray-500 shrink-0">{label}:</span>
                          <span className="text-gray-700 font-medium">{typeof value === "boolean" ? "Yes" : Array.isArray(value) ? value.join(", ") : String(value)}</span>
                        </div>
                      );
                    })}
                    {Object.entries(FIELD_LABELS).every(([f]) => { const v = it[f]; return v === null || v === undefined || v === "" || v === false; }) && (
                      <p className="text-gray-500 italic col-span-full">No itinerary details yet.</p>
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
