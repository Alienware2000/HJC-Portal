import { ImportWizard } from "@/components/admin/import-wizard";

export const metadata = { title: "Imports — Healing Jesus Conference" };

export default function ImportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">Import Members</h2>
        <p className="text-sm text-gray-500 mt-1">Upload a CSV file to bulk-import board members.</p>
      </div>
      <ImportWizard />
    </div>
  );
}
