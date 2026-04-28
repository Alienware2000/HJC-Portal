"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createEvent } from "@/actions/events";

function defaultYear(): number {
  const now = new Date();
  // After August, default to next year — most planning happens 4–10 months out.
  return now.getMonth() >= 7 ? now.getFullYear() + 1 : now.getFullYear();
}

export function EventSetupCard() {
  const router = useRouter();
  const [year, setYear] = useState<number>(defaultYear());
  const [name, setName] = useState<string>(`Healing Jesus Conference ${defaultYear()}`);
  const [isPending, startTransition] = useTransition();

  const handleYearChange = (raw: string) => {
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n)) {
      setYear(n);
      // Auto-update name if it still matches the default pattern
      setName((prev) => {
        const isDefault = /^Healing Jesus Conference \d{4}$/.test(prev);
        return isDefault ? `Healing Jesus Conference ${n}` : prev;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Enter an event name"); return; }
    if (!Number.isFinite(year) || year < 2024 || year > 2100) {
      toast.error("Enter a valid year");
      return;
    }
    startTransition(async () => {
      const result = await createEvent({ year, name: name.trim() });
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        toast.success(`${result.data.name} is now active`);
        router.refresh();
      }
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-1 shadow-[0_2px_8px_rgba(37,99,235,0.15),0_24px_48px_rgba(37,99,235,0.12)]">
      <div className="rounded-[14px] bg-white p-7 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(37,99,235,0.3)]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">Set up your conference year</h3>
            <p className="text-[14px] text-gray-500 mt-1.5 leading-relaxed max-w-xl">
              No active event yet. Create one so you can generate access codes, import board members, and let people log in.
              You can add more years later.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 grid sm:grid-cols-[120px_1fr_auto] gap-2.5">
              <label className="block">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.06em] mb-1 block">Year</span>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="number"
                    min={2024}
                    max={2100}
                    value={year}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="w-full h-10 pl-8 pr-2 rounded-lg bg-gray-50 border border-gray-200/60 text-sm text-gray-900 tabular-nums shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:border-blue-300 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1),inset_0_1px_2px_rgba(0,0,0,0.06)] focus:outline-none transition-all"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.06em] mb-1 block">Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={200}
                  placeholder="Healing Jesus Conference 2026"
                  className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200/60 text-sm text-gray-900 placeholder:text-gray-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:border-blue-300 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1),inset_0_1px_2px_rgba(0,0,0,0.06)] focus:outline-none transition-all"
                />
              </label>

              <div className="block">
                <span className="text-[11px] font-semibold text-transparent uppercase tracking-[0.06em] mb-1 block sm:block hidden" aria-hidden>·</span>
                <button
                  type="submit"
                  disabled={isPending || !name.trim()}
                  className="w-full sm:w-auto h-10 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 active:bg-gray-950 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Create event <ArrowRight className="h-3.5 w-3.5" /></>}
                </button>
              </div>
            </form>

            <p className="text-[12px] text-gray-400 mt-4">
              Activating this event makes it the default for new access codes, imports, and member registrations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
