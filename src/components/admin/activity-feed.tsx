import { formatDistanceToNow } from "date-fns";
import { FileText } from "lucide-react";
import { FIELD_LABELS } from "@/lib/validations/itinerary";

interface ChangeLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  user_id: string | null;
  changes: Record<string, { old: unknown; new: unknown }>;
  created_at: string;
}

export function ActivityFeed({ entries, compact = false }: { entries: ChangeLogEntry[]; compact?: boolean }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl bg-white py-16 text-center shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)]">
        <div className="mx-auto h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
          <FileText className="h-5 w-5 text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-900">No activity yet</p>
        <p className="text-[13px] text-gray-400 mt-1">Changes will appear here as members update itineraries.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)] overflow-hidden divide-y divide-gray-100">
      {entries.map((entry) => {
        const changedFields = Object.keys(entry.changes || {});
        const timeAgo = formatDistanceToNow(new Date(entry.created_at), { addSuffix: true });

        return (
          <div key={entry.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">Itinerary updated</p>
                  <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">{timeAgo}</span>
                </div>
                {!compact && changedFields.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {changedFields.slice(0, 5).map((field) => {
                      const label = FIELD_LABELS[field] || field;
                      const newVal = String(entry.changes[field].new || "—");
                      return (
                        <span key={field} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md" title={`${label}: ${newVal}`}>
                          <span className="font-medium">{label}</span>
                          <span className="text-gray-400">&rarr;</span>
                          <span className="text-gray-800">{newVal.length > 25 ? newVal.slice(0, 25) + "..." : newVal}</span>
                        </span>
                      );
                    })}
                    {changedFields.length > 5 && <span className="text-xs text-gray-400 px-1">+{changedFields.length - 5}</span>}
                  </div>
                )}
                {compact && (
                  <p className="text-[13px] text-gray-400 mt-0.5">{changedFields.length} field{changedFields.length !== 1 ? "s" : ""} changed</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
