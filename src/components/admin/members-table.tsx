"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronUp, ChevronDown, Users } from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  completion_pct: number;
  access_code: string | null;
  party_count: number;
  created_at: string;
}

type SortKey = "name" | "completion_pct" | "party_count";
type SortDir = "asc" | "desc";

export function MembersTable({ members, basePath = "/admin/members" }: { members: Member[]; basePath?: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || (m.email?.toLowerCase().includes(q) ?? false) || (m.access_code?.toLowerCase().includes(q) ?? false);
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name") cmp = a.name.localeCompare(b.name);
    else if (sortKey === "completion_pct") cmp = Number(a.completion_pct) - Number(b.completion_pct);
    else if (sortKey === "party_count") cmp = a.party_count - b.party_count;
    return sortDir === "desc" ? -cmp : cmp;
  });

  const sortIcon = (field: SortKey) => {
    if (sortKey !== field) return <ChevronUp className="h-3 w-3 text-gray-300" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3 text-gray-500" /> : <ChevronDown className="h-3 w-3 text-gray-500" />;
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          placeholder="Search members..."
          className="w-full h-10 pl-9 pr-3 rounded-lg bg-gray-50 border border-gray-200/60 text-sm text-gray-900 placeholder:text-gray-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:border-blue-300 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1),inset_0_1px_2px_rgba(0,0,0,0.06)] focus:outline-none transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <Th onClick={() => toggleSort("name")} sorted={sortIcon("name")}>Name</Th>
              <Th className="hidden sm:table-cell">Code</Th>
              <Th className="hidden md:table-cell">Email</Th>
              <Th onClick={() => toggleSort("party_count")} sorted={sortIcon("party_count")} align="center">Party</Th>
              <Th onClick={() => toggleSort("completion_pct")} sorted={sortIcon("completion_pct")} align="right">Progress</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((m) => (
              <tr key={m.id} onClick={() => router.push(`${basePath}/${m.id}`)} tabIndex={0} role="link" aria-label={`View ${m.name}`} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`${basePath}/${m.id}`); } }} className="group cursor-pointer transition-colors hover:bg-gray-50/80 focus:bg-gray-50/80 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:ring-inset">
                <td className="relative px-4 py-3">
                  <div className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-gray-500">{m.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{m.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <code className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{m.access_code || "—"}</code>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{m.email || "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-500 text-center tabular-nums">{m.party_count}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-14 rounded-full bg-gray-100 overflow-hidden hidden sm:block">
                      <div className={`h-full rounded-full ${Number(m.completion_pct) >= 67 ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${m.completion_pct}%` }} />
                    </div>
                    <span className="text-[13px] font-semibold text-gray-600 tabular-nums w-8 text-right">{Math.round(Number(m.completion_pct))}%</span>
                  </div>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-16 text-center">
                <div className="mx-auto max-w-[280px]">
                  <div className="mx-auto h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                    <Users className="h-5 w-5 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{search ? "No members match your search" : "No members yet"}</p>
                  <p className="text-[13px] text-gray-400 mt-1">
                    {search
                      ? "Try a different name, email, or access code."
                      : "Members will appear here once they log in with their access codes."}
                  </p>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400">{sorted.length} of {members.length} members</p>
    </div>
  );
}

function Th({ children, onClick, sorted, className, align }: { children: React.ReactNode; onClick?: () => void; sorted?: React.ReactNode; className?: string; align?: "center" | "right" }) {
  return (
    <th
      className={`px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider ${align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"} ${onClick ? "cursor-pointer select-none" : ""} ${className || ""}`}
      onClick={onClick}
    >
      <span className="inline-flex items-center gap-1">{children}{sorted}</span>
    </th>
  );
}
