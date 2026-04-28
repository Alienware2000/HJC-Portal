"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Trash2,
  Copy,
  Check,
  KeyRound,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { generateAccessCode, deleteAccessCode } from "@/actions/access-codes";

interface AccessCode {
  id: string;
  code: string;
  board_member_name: string;
  is_used: boolean;
  created_at: string;
  board_members?: { name: string } | null;
}

type StatusFilter = "all" | "unused" | "used";
const PAGE_SIZE_OPTIONS = [25, 50, 100];

export function AccessCodesPanel({ codes }: { codes: AccessCode[] }) {
  const [name, setName] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [isPending, startTransition] = useTransition();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const router = useRouter();

  const handleGenerate = () => {
    if (!name.trim()) { toast.error("Enter a board member name"); return; }
    startTransition(async () => {
      const result = await generateAccessCode(name.trim());
      if (result.error) toast.error(result.error);
      else if (result.data) { toast.success(`Code generated: ${result.data.code}`); setName(""); router.refresh(); }
    });
  };

  const handleDelete = (codeId: string, codeName: string) => {
    if (!confirm(`Delete code for ${codeName}?`)) return;
    startTransition(async () => {
      const result = await deleteAccessCode(codeId);
      if (result.error) toast.error(result.error);
      else { toast.success("Deleted"); router.refresh(); }
    });
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Code copied");
    setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 2000);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return codes.filter((c) => {
      if (filter === "unused" && c.is_used) return false;
      if (filter === "used" && !c.is_used) return false;
      if (q) {
        const hit = c.code.toLowerCase().includes(q) || c.board_member_name.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [codes, filter, search]);

  useEffect(() => { setPage(0); }, [search, filter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageStart = safePage * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filtered.length);
  const visible = filtered.slice(pageStart, pageEnd);
  const showPagination = filtered.length > pageSize;

  const counts = useMemo(() => ({
    all: codes.length,
    unused: codes.filter((c) => !c.is_used).length,
    used: codes.filter((c) => c.is_used).length,
  }), [codes]);

  return (
    <div className="space-y-6">
      {/* Generate */}
      <div className="relative overflow-hidden rounded-xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)]">
        <p className="text-[14px] font-semibold text-gray-900 mb-1">Generate Access Code</p>
        <p className="text-[13px] text-gray-500 mb-3">Creates one code at a time. For bulk import use <a href="/admin/imports" className="text-blue-600 hover:underline">Imports</a>.</p>
        <div className="flex gap-2">
          <input
            placeholder="Board member full name..."
            className="flex-1 h-10 px-3 rounded-lg bg-gray-50 border border-gray-200/60 text-sm placeholder:text-gray-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:border-blue-300 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1),inset_0_1px_2px_rgba(0,0,0,0.06)] focus:outline-none transition-all"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="h-10 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 active:bg-gray-950 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-1.5 shadow-sm shrink-0"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Generate
          </button>
        </div>
      </div>

      {/* Toolbar: search + status chips */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search code or name…"
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-gray-50 border border-gray-200/60 text-sm text-gray-900 placeholder:text-gray-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:border-blue-300 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1),inset_0_1px_2px_rgba(0,0,0,0.06)] focus:outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(["all", "unused", "used"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all focus-visible:ring-2 focus-visible:ring-ring/50 ${
                filter === f
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? "All" : f === "unused" ? "Available" : "Used"}{" "}
              <span className="tabular-nums opacity-70">({counts[f]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em]">Code</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em]">Name</th>
              <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] hidden sm:table-cell">Status</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visible.map((code) => (
              <tr key={code.id} className="hover:bg-gray-50/70 transition-colors">
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => handleCopy(code.code)}
                    className="group/code inline-flex items-center gap-1.5 rounded-md bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                    aria-label={copiedCode === code.code ? "Code copied" : `Copy code ${code.code}`}
                  >
                    <code className="text-[13px] font-mono font-semibold text-gray-800 tabular-nums">{code.code}</code>
                    {copiedCode === code.code ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-gray-400 group-hover/code:text-gray-600" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-4 text-[14px] text-gray-700 tracking-tight">{code.board_member_name}</td>
                <td className="px-4 py-4 text-center hidden sm:table-cell">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-md px-2 py-0.5 ${code.is_used ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${code.is_used ? "bg-emerald-500" : "bg-gray-400"}`} />
                    {code.is_used ? "Used" : "Available"}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {!code.is_used && (
                      <button
                        onClick={() => handleDelete(code.id, code.board_member_name)}
                        aria-label={`Delete code for ${code.board_member_name}`}
                        className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-ring/50 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-16 text-center">
                  <div className="mx-auto max-w-[280px]">
                    <div className="mx-auto h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                      <KeyRound className="h-5 w-5 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {search || filter !== "all" ? "No codes match these filters" : "No access codes yet"}
                    </p>
                    <p className="text-[13px] text-gray-400 mt-1">
                      {search || filter !== "all"
                        ? "Try adjusting search or status filter."
                        : "Generate one above, or import a roster from the Imports page."}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Footer / pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
        <div className="text-gray-500 tabular-nums">
          {filtered.length === 0 ? (
            <>0 codes</>
          ) : (
            <>
              Showing <span className="font-semibold text-gray-700">{pageStart + 1}</span>–<span className="font-semibold text-gray-700">{pageEnd}</span> of <span className="font-semibold text-gray-700">{filtered.length}</span>
              {filtered.length !== codes.length && <span className="text-gray-400"> · {codes.length} total</span>}
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
          <label htmlFor="ac-page-size" className="text-[12px]">Rows</label>
          <select
            id="ac-page-size"
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
