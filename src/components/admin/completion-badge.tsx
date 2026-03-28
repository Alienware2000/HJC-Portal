import { cn } from "@/lib/utils";

export function CompletionBadge({ pct }: { pct: number }) {
  const rounded = Math.round(pct);
  return (
    <span className={cn(
      "text-xs font-semibold px-2.5 py-1 rounded-md tabular-nums",
      rounded === 0 ? "bg-gray-100 text-gray-500" :
      rounded < 50 ? "bg-blue-50 text-blue-700" :
      rounded < 100 ? "bg-blue-50 text-blue-700" :
      "bg-emerald-50 text-emerald-700"
    )}>
      {rounded}%
    </span>
  );
}
