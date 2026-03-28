"use client";

import { useState, useTransition, useRef } from "react";
import { Upload, ArrowRight, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";


import { parseCSV } from "@/lib/parse-csv";
import { autoMapColumns, IMPORTABLE_FIELDS } from "@/lib/import-mapper";
import { importMembers } from "@/actions/imports";

type Step = "upload" | "mapping" | "preview" | "importing" | "results";

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

export function ImportWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.headers.length === 0) {
        toast.error("Could not parse CSV file");
        return;
      }
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMapping(autoMapColumns(parsed.headers));
      setStep("mapping");
    };
    reader.readAsText(file);
  };

  const handleMappingChange = (csvHeader: string, field: string) => {
    setMapping((prev) => ({ ...prev, [csvHeader]: field }));
  };

  const getMappedRows = () => {
    return rows.map((row) => {
      const mapped: Record<string, unknown> = {};
      for (const [csvHeader, field] of Object.entries(mapping)) {
        if (field && field !== "__skip__") {
          mapped[field] = row[csvHeader] || "";
        }
      }
      return mapped;
    });
  };

  const handleImport = () => {
    const mapped = getMappedRows();
    const valid = mapped.filter((r) => r.board_member_name);
    if (valid.length === 0) {
      toast.error("No valid rows to import. Ensure 'Board Member Name' is mapped.");
      return;
    }

    startTransition(async () => {
      setStep("importing");
      const res = await importMembers(
        valid as { board_member_name: string; [key: string]: unknown }[]
      );
      setResult(res);
      setStep("results");
    });
  };

  const reset = () => {
    setStep("upload");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const STEPS = ["upload", "mapping", "preview", "importing", "results"] as const;
  const stepIndex = STEPS.indexOf(step);

  const stepIndicator = (
    <div className="flex items-center gap-1 mb-6">
      {STEPS.filter(s => s !== "importing").map((s, i) => {
        const actualIndex = s === "results" ? 3 : i;
        const isComplete = stepIndex > actualIndex;
        const isCurrent = step === s || (step === "importing" && s === "results");
        return (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all ${
              isComplete ? "bg-emerald-500 text-white" : isCurrent ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {isComplete ? "✓" : actualIndex + 1}
            </div>
            {i < 3 && <div className={`h-0.5 flex-1 rounded-full transition-all ${isComplete ? "bg-emerald-500" : "bg-gray-200"}`} />}
          </div>
        );
      })}
    </div>
  );

  if (step === "upload") {
    return (
      <div>
        {stepIndicator}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-[14px] font-semibold text-gray-900 mb-4">Upload CSV File</p>
          <label className="flex flex-col items-center justify-center h-44 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/20 cursor-pointer transition-all">
            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
              <Upload className="h-5 w-5 text-gray-500" />
            </div>
            <p className="text-[14px] font-medium text-gray-700">Drop a CSV file here, or click to browse</p>
            <p className="text-[13px] text-gray-400 mt-1">Supports .csv files</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>
    );
  }

  if (step === "mapping") {
    const hasBoardMemberName = Object.values(mapping).includes("board_member_name");
    return (
      <div className="space-y-4">
        {stepIndicator}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-[14px] font-semibold text-gray-900 mb-4">
            Map Columns <span className="text-gray-400 font-normal">({rows.length} rows)</span>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-2.5 pr-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">CSV Column</th>
                  <th className="py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Maps To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {headers.map((h) => (
                  <tr key={h}>
                    <td className="py-2.5 pr-4"><code className="text-[13px] font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{h}</code></td>
                    <td className="py-2.5">
                      <select
                        className="w-full h-8 rounded-lg border border-gray-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300"
                        value={mapping[h] || "__skip__"}
                        onChange={(e) => handleMappingChange(h, e.target.value)}
                      >
                        {IMPORTABLE_FIELDS.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!hasBoardMemberName && (
            <p className="mt-3 text-[13px] text-red-600">Map at least one column to &quot;Board Member Name&quot;.</p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <button onClick={() => setStep("preview")} disabled={!hasBoardMemberName} className="h-9 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center gap-1">
            Preview <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (step === "preview") {
    const mapped = getMappedRows();
    const validCount = mapped.filter((r) => r.board_member_name).length;
    const previewRows = mapped.slice(0, 10);
    const mappedFields = Object.values(mapping).filter((v) => v && v !== "__skip__");

    return (
      <div className="space-y-4">
        {stepIndicator}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-[14px] font-semibold text-gray-900 mb-4">
            Preview <span className="text-gray-400 font-normal">{validCount} valid of {rows.length}</span>
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  {mappedFields.map((f) => (
                    <th key={f} className="py-2.5 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {IMPORTABLE_FIELDS.find((i) => i.value === f)?.label || f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {previewRows.map((row, i) => (
                  <tr key={i}>
                    {mappedFields.map((f) => (
                      <td key={f} className="py-2 px-3 text-sm text-gray-700 whitespace-nowrap">{String(row[f] || "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 10 && <p className="mt-2 text-xs text-gray-400">Showing first 10 of {rows.length}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStep("mapping")} className="h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <button onClick={handleImport} disabled={isPending} className="h-9 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-all">
            Import {validCount} Members
          </button>
        </div>
      </div>
    );
  }

  if (step === "importing") {
    return (
      <div>
        {stepIndicator}
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-4 text-[14px] text-gray-500">Importing members...</p>
        </div>
      </div>
    );
  }

  if (step === "results" && result) {
    return (
      <div className="space-y-4">
        {stepIndicator}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <p className="text-[14px] font-semibold text-gray-900">Import Complete</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Created", value: result.created, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Updated", value: result.updated, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Skipped", value: result.skipped, color: "text-gray-500", bg: "bg-gray-100" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`rounded-lg ${bg} p-4 text-center`}>
                <p className={`text-[24px] font-bold ${color}`}>{value}</p>
                <p className="text-[13px] text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
          {result.errors.length > 0 && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="flex items-center gap-1.5 text-sm font-medium text-red-700 mb-2">
                <AlertCircle className="h-4 w-4" /> {result.errors.length} errors
              </p>
              <ul className="space-y-1 text-[13px] text-red-600">
                {result.errors.slice(0, 10).map((e, i) => (
                  <li key={i}>Row {e.row}: {e.message}</li>
                ))}
                {result.errors.length > 10 && <li>+{result.errors.length - 10} more</li>}
              </ul>
            </div>
          )}
        </div>
        <button onClick={reset} className="h-9 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-all">
          Import Another File
        </button>
      </div>
    );
  }

  return null;
}
