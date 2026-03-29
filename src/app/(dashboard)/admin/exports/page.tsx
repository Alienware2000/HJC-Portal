"use client";

import { useState } from "react";
import { Download, Users, Hotel, Plane, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export default function ExportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());

  const exports = [
    { type: "all-members", label: "All Members", description: "Complete roster with itinerary data", icon: Users, color: "blue" },
    { type: "rooming-list", label: "Rooming List", description: "Hotel preferences and room assignments", icon: Hotel, color: "purple" },
    { type: "pickup-schedule", label: "Pickup Schedule", description: "Airport arrival and pickup details", icon: Plane, color: "emerald" },
  ];

  const handleExport = async (type: string) => {
    setDownloading(type);
    try {
      const res = await fetch(`/api/exports/${type}`);
      if (!res.ok) {
        toast.error(res.status === 401 ? "Unauthorized" : "Export failed");
        setDownloading(null);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("content-disposition")?.split("filename=")[1]?.replace(/"/g, "") || `${type}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloaded((prev) => new Set(prev).add(type));
      toast.success("Download started");
    } catch {
      toast.error("Failed to download export");
    }
    setDownloading(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">Exports</h2>
        <p className="text-sm text-gray-500 mt-1">Download conference data as CSV files.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {exports.map((exp) => {
          const isDownloading = downloading === exp.type;
          const isDone = downloaded.has(exp.type);
          return (
            <button
              key={exp.type}
              onClick={() => handleExport(exp.type)}
              disabled={isDownloading}
              className="text-left rounded-xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_4px_8px_rgba(0,0,0,0.07),0_24px_48px_rgba(0,0,0,0.09)] transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait"
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${exp.color === "blue" ? "bg-blue-50" : exp.color === "purple" ? "bg-purple-50" : "bg-emerald-50"}`}>
                <exp.icon className={`h-5 w-5 ${exp.color === "blue" ? "text-blue-600" : exp.color === "purple" ? "text-purple-600" : "text-emerald-600"}`} />
              </div>
              <p className="text-sm font-semibold text-gray-900">{exp.label}</p>
              <p className="text-[13px] text-gray-400 mt-1">{exp.description}</p>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium">
                {isDownloading ? (
                  <><Loader2 className="h-3 w-3 animate-spin text-gray-400" /> <span className="text-gray-400">Preparing...</span></>
                ) : isDone ? (
                  <><Check className="h-3 w-3 text-emerald-500" /> <span className="text-emerald-600">Downloaded</span></>
                ) : (
                  <><Download className="h-3 w-3 text-blue-600" /> <span className="text-blue-600">Download CSV</span></>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
