import { ImportWizard } from "@/components/admin/import-wizard";

export const metadata = { title: "Imports — Healing Jesus Conference" };

export default function ImportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">Import Members</h2>
        <p className="text-sm text-gray-500 mt-1">Upload a CSV file to bulk-import board members.</p>
      </div>
      <div className="rounded-lg bg-blue-50/60 border border-blue-100 px-4 py-3 text-[13px] text-blue-800">
        <p className="font-medium mb-1">CSV format tips</p>
        <ul className="list-disc pl-4 space-y-0.5 text-blue-700">
          <li>Required column: <span className="font-mono text-[12px] bg-blue-100 px-1 rounded">board_member_name</span></li>
          <li>Optional: <span className="font-mono text-[12px] bg-blue-100 px-1 rounded">access_code</span> (auto-generated if omitted)</li>
          <li>You can also include itinerary fields like <span className="font-mono text-[12px] bg-blue-100 px-1 rounded">arrival_date</span>, <span className="font-mono text-[12px] bg-blue-100 px-1 rounded">hotel_preference</span>, etc.</li>
          <li>Column names are matched automatically — you&apos;ll map them in the next step</li>
        </ul>
      </div>
      <ImportWizard />
    </div>
  );
}
