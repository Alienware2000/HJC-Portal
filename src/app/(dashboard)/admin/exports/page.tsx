"use client";

import { Download, Users, Hotel, Plane } from "lucide-react";

export default function ExportsPage() {
  const exports = [
    { type: "all-members", label: "All Members", description: "Complete roster with itinerary data", icon: Users, color: "blue" },
    { type: "rooming-list", label: "Rooming List", description: "Hotel preferences and room assignments", icon: Hotel, color: "purple" },
    { type: "pickup-schedule", label: "Pickup Schedule", description: "Airport arrival and pickup details", icon: Plane, color: "emerald" },
  ];

  const handleExport = (type: string) => {
    window.open(`/api/exports/${type}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">Exports</h2>
        <p className="text-sm text-gray-500 mt-1">Download conference data as CSV files.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {exports.map((exp) => (
          <button key={exp.type} onClick={() => handleExport(exp.type)} className="text-left rounded-xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_4px_8px_rgba(0,0,0,0.07),0_24px_48px_rgba(0,0,0,0.09)] transition-all hover:-translate-y-0.5">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${exp.color === "blue" ? "bg-blue-50" : exp.color === "purple" ? "bg-purple-50" : "bg-emerald-50"}`}>
              <exp.icon className={`h-5 w-5 ${exp.color === "blue" ? "text-blue-600" : exp.color === "purple" ? "text-purple-600" : "text-emerald-600"}`} />
            </div>
            <p className="text-sm font-semibold text-gray-900">{exp.label}</p>
            <p className="text-[13px] text-gray-400 mt-1">{exp.description}</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600">
              <Download className="h-3 w-3" /> Download CSV
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
