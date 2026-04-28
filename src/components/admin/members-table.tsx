"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Copy,
  Check,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  contact_emails: string[] | null;
  country: string | null;
  city: string | null;
  language: string | null;
  ministry: string | null;
  year_joined: number | null;
  completion_pct: number;
  access_code: string | null;
  party_count: number;
  created_at: string;
}

type SortKey = "name" | "completion_pct" | "party_count";
type SortDir = "asc" | "desc";
type StatusFilter = "all" | "not_started" | "in_progress" | "complete";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function MembersTable({ members, basePath = "/admin/members" }: { members: Member[]; basePath?: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Distinct countries with counts (sorted by count desc, then name asc)
  const countries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of members) {
      if (m.country) counts.set(m.country, (counts.get(m.country) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [members]);

  const statusCounts = useMemo(() => {
    let notStarted = 0, inProgress = 0, complete = 0;
    for (const m of members) {
      const pct = Number(m.completion_pct);
      if (pct === 0) notStarted++;
      else if (pct < 100) inProgress++;
      else complete++;
    }
    return { all: members.length, notStarted, inProgress, complete };
  }, [members]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter((m) => {
      if (q) {
        const hit =
          m.name.toLowerCase().includes(q) ||
          (m.email?.toLowerCase().includes(q) ?? false) ||
          (m.contact_emails?.some((e) => e.toLowerCase().includes(q)) ?? false) ||
          (m.access_code?.toLowerCase().includes(q) ?? false) ||
          (m.country?.toLowerCase().includes(q) ?? false) ||
          (m.ministry?.toLowerCase().includes(q) ?? false) ||
          (m.city?.toLowerCase().includes(q) ?? false) ||
          (m.phone?.toLowerCase().includes(q) ?? false);
        if (!hit) return false;
      }
      if (countryFilter && m.country !== countryFilter) return false;
      if (statusFilter !== "all") {
        const pct = Number(m.completion_pct);
        if (statusFilter === "not_started" && pct !== 0) return false;
        if (statusFilter === "in_progress" && (pct === 0 || pct >= 100)) return false;
        if (statusFilter === "complete" && pct < 100) return false;
      }
      return true;
    });
  }, [members, search, countryFilter, statusFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "completion_pct") cmp = Number(a.completion_pct) - Number(b.completion_pct);
      else if (sortKey === "party_count") cmp = a.party_count - b.party_count;
      return sortDir === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  // Reset to page 0 when filter/search/sort/page size changes
  useEffect(() => { setPage(0); }, [search, countryFilter, statusFilter, sortKey, sortDir, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageStart = safePage * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, sorted.length);
  const visibleRows = sorted.slice(pageStart, pageEnd);

  const sortIcon = (field: SortKey) => {
    if (sortKey !== field) return <ChevronUp className="h-3 w-3 text-gray-300" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3 text-gray-500" /> : <ChevronDown className="h-3 w-3 text-gray-500" />;
  };

  const handleCopy = (key: string, value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    toast.success(`${label} copied`);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
  };

  const showPagination = sorted.length > pageSize;

  const STATUS_CHIPS: { id: StatusFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: statusCounts.all },
    { id: "not_started", label: "Not Started", count: statusCounts.notStarted },
    { id: "in_progress", label: "In Progress", count: statusCounts.inProgress },
    { id: "complete", label: "Complete", count: statusCounts.complete },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search name, country, ministry, email…"
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-gray-50 border border-gray-200/60 text-sm text-gray-900 placeholder:text-gray-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:border-blue-300 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1),inset_0_1px_2px_rgba(0,0,0,0.06)] focus:outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              className="h-10 pl-9 pr-8 rounded-lg bg-gray-50 border border-gray-200/60 text-sm text-gray-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:border-blue-300 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1),inset_0_1px_2px_rgba(0,0,0,0.06)] focus:outline-none transition-all appearance-none cursor-pointer"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              aria-label="Filter by country"
            >
              <option value="">All countries ({members.length})</option>
              {countries.map((c) => (
                <option key={c.name} value={c.name}>{c.name} ({c.count})</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STATUS_CHIPS.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setStatusFilter(chip.id)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all focus-visible:ring-2 focus-visible:ring-ring/50 ${
                statusFilter === chip.id
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
              }`}
            >
              {chip.label} <span className="tabular-nums opacity-70">({chip.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/40">
              <Th onClick={() => toggleSort("name")} sorted={sortIcon("name")}>Name</Th>
              <Th className="hidden md:table-cell">Country</Th>
              <Th className="hidden sm:table-cell">Code</Th>
              <Th className="hidden lg:table-cell">Email</Th>
              <Th className="hidden lg:table-cell">Phone</Th>
              <Th onClick={() => toggleSort("party_count")} sorted={sortIcon("party_count")} align="center">Party</Th>
              <Th onClick={() => toggleSort("completion_pct")} sorted={sortIcon("completion_pct")} align="right">Progress</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visibleRows.map((m) => {
              const codeCopied = copiedKey === `code-${m.id}`;
              const phoneCopied = copiedKey === `phone-${m.id}`;
              const pct = Number(m.completion_pct);
              const accentColor = pct === 0
                ? "bg-amber-400"
                : pct >= 100
                  ? "bg-emerald-500"
                  : "bg-blue-500";
              return (
              <tr
                key={m.id}
                onClick={() => router.push(`${basePath}/${m.id}`)}
                tabIndex={0}
                role="link"
                aria-label={`View ${m.name}`}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`${basePath}/${m.id}`); } }}
                className="group cursor-pointer transition-colors hover:bg-gray-50/70 focus:bg-gray-50/70 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:ring-inset"
              >
                <td className="relative px-4 py-4 lg:py-4">
                  <div className={`absolute inset-y-2.5 left-0 w-[3px] rounded-r-full ${accentColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 ring-1 ring-gray-200/60 flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-bold text-gray-600 tracking-wide">
                        {m.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold text-gray-900 tracking-tight truncate">{m.name}</div>
                      {m.ministry && (
                        <div className="text-[12.5px] text-gray-400 truncate max-w-[280px] leading-snug">{m.ministry}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-[14px] text-gray-600 tracking-tight hidden md:table-cell">
                  {m.country || <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-4 hidden sm:table-cell">
                  {m.access_code ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleCopy(`code-${m.id}`, m.access_code!, "Code"); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") e.stopPropagation(); }}
                      className="group/code inline-flex items-center gap-1.5 rounded-md bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                      aria-label={codeCopied ? "Code copied" : `Copy code ${m.access_code}`}
                    >
                      <code className="text-[12px] font-mono text-gray-700 tabular-nums">{m.access_code}</code>
                      {codeCopied ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3 text-gray-400 group-hover/code:text-gray-600" />
                      )}
                    </button>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 hidden lg:table-cell">
                  {m.contact_emails && m.contact_emails.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="truncate max-w-[200px]">{m.contact_emails[0]}</span>
                      {m.contact_emails.length > 1 && (
                        <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">+{m.contact_emails.length - 1}</span>
                      )}
                    </span>
                  ) : (
                    <span className="italic text-gray-400">No contact email provided</span>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 hidden lg:table-cell">
                  {m.phone ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleCopy(`phone-${m.id}`, m.phone!, "Phone"); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") e.stopPropagation(); }}
                      className="group/phone inline-flex items-center gap-1.5 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors px-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                      aria-label={phoneCopied ? "Phone copied" : `Copy phone ${m.phone}`}
                    >
                      <span className="tabular-nums text-[13px] text-gray-600">{m.phone}</span>
                      {phoneCopied ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3 text-gray-300 group-hover/phone:text-gray-500" />
                      )}
                    </button>
                  ) : (
                    <span className="italic text-gray-400">No phone provided</span>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 text-center tabular-nums">{m.party_count}</td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden hidden sm:block">
                      <div className={`h-full rounded-full transition-all ${Number(m.completion_pct) >= 100 ? "bg-emerald-500" : Number(m.completion_pct) >= 67 ? "bg-emerald-400" : Number(m.completion_pct) > 0 ? "bg-blue-500" : "bg-gray-300"}`} style={{ width: `${Math.max(2, Number(m.completion_pct))}%` }} />
                    </div>
                    <span className="text-[13px] font-semibold text-gray-700 tabular-nums w-9 text-right">{Math.round(Number(m.completion_pct))}%</span>
                    <ChevronRight className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 group-hover:text-gray-500 transition-all -mr-1" />
                  </div>
                </td>
              </tr>
              );
            })}
            {visibleRows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-16 text-center">
                <div className="mx-auto max-w-[320px]">
                  <div className="mx-auto h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                    <Users className="h-5 w-5 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{search || countryFilter || statusFilter !== "all" ? "No members match these filters" : "No members yet"}</p>
                  <p className="text-[13px] text-gray-400 mt-1">
                    {search || countryFilter || statusFilter !== "all"
                      ? "Try adjusting search, country, or status filters."
                      : "Members will appear here once they log in with their access codes."}
                  </p>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Footer / pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
        <div className="text-gray-500 tabular-nums">
          {sorted.length === 0 ? (
            <>0 members</>
          ) : (
            <>
              Showing <span className="font-semibold text-gray-700">{pageStart + 1}</span>–<span className="font-semibold text-gray-700">{pageEnd}</span> of <span className="font-semibold text-gray-700">{sorted.length}</span>
              {sorted.length !== members.length && <span className="text-gray-400"> · {members.length} total</span>}
            </>
          )}
        </div>

        {showPagination && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="h-8 px-2.5 inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="text-gray-500 tabular-nums">
              Page <span className="font-semibold text-gray-700">{safePage + 1}</span> of <span className="font-semibold text-gray-700">{totalPages}</span>
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="h-8 px-2.5 inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
              aria-label="Next page"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 text-gray-500">
          <label htmlFor="page-size" className="text-[12px]">Rows</label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-8 pl-2 pr-7 rounded-md border border-gray-200 bg-white text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none cursor-pointer tabular-nums"
            style={{ backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.4rem center" }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function Th({ children, onClick, sorted, className, align }: { children: React.ReactNode; onClick?: () => void; sorted?: React.ReactNode; className?: string; align?: "center" | "right" }) {
  return (
    <th
      className={`px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] ${align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"} ${onClick ? "cursor-pointer select-none hover:text-gray-600" : ""} ${className || ""}`}
      onClick={onClick}
    >
      <span className="inline-flex items-center gap-1">{children}{sorted}</span>
    </th>
  );
}
