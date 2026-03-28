"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Copy, Check, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { generateAccessCode, deleteAccessCode } from "@/actions/access-codes";

interface AccessCode { id: string; code: string; board_member_name: string; is_used: boolean; created_at: string; board_members?: { name: string } | null; }

export function AccessCodesPanel({ codes }: { codes: AccessCode[] }) {
  const [name, setName] = useState("");
  const [filter, setFilter] = useState<"all" | "unused" | "used">("all");
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
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filtered = codes.filter((c) => filter === "unused" ? !c.is_used : filter === "used" ? c.is_used : true);

  return (
    <div className="space-y-6">
      {/* Generate */}
      <div className="relative overflow-hidden rounded-xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)]">
        <p className="text-sm font-semibold text-gray-900 mb-3">Generate New Code</p>
        <div className="flex gap-2">
          <input
            placeholder="Board member full name..."
            className="flex-1 h-10 px-3 rounded-lg bg-gray-50 border border-gray-200/60 text-sm placeholder:text-gray-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:border-blue-300 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1),inset_0_1px_2px_rgba(0,0,0,0.06)] focus:outline-none transition-all"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          />
          <button onClick={handleGenerate} disabled={isPending} className="h-9 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm shrink-0">
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Generate
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5">
        {(["all", "unused", "used"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all ${filter === f ? "bg-gray-900 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:text-gray-700"}`}>
            {f === "all" ? `All (${codes.length})` : f === "unused" ? `Unused (${codes.filter((c) => !c.is_used).length})` : `Used (${codes.filter((c) => c.is_used).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Code</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((code) => (
              <tr key={code.id} className="hover:bg-gray-50/70 transition-colors">
                <td className="px-4 py-3">
                  <code className="text-[13px] font-mono font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded-md tracking-wide">{code.code}</code>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{code.board_member_name}</td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-md px-2 py-0.5 ${code.is_used ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${code.is_used ? "bg-emerald-500" : "bg-gray-400"}`} />
                    {code.is_used ? "Used" : "Available"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => handleCopy(code.code)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                      {copiedCode === code.code ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    {!code.is_used && (
                      <button onClick={() => handleDelete(code.id, code.board_member_name)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-16 text-center">
                <div className="mx-auto max-w-[240px]">
                  <div className="mx-auto h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                    <KeyRound className="h-5 w-5 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">No codes found</p>
                  <p className="text-[13px] text-gray-400 mt-1">Generate an access code to get started.</p>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
