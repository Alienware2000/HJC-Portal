"use client";

import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Plane,
  PlaneTakeoff,
  Hotel,
  Calendar,
  Car,
  FileText,
  Phone,
  Loader2,
  Check,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { updateItineraryFields } from "@/actions/itinerary";
import {
  ITINERARY_SECTIONS,
  FIELD_LABELS,
  ROOM_TYPE_OPTIONS,
  VISA_STATUS_OPTIONS,
} from "@/lib/validations/itinerary";
import { cn } from "@/lib/utils";

interface ItineraryFormProps {
  itinerary: Record<string, unknown> & { id: string; completion_pct: number };
  personName: string;
  backHref?: string;
}

const SECTION_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  color: string; bg: string;
  subtitle: string;
}> = {
  arrival: { icon: Plane, color: "text-blue-600", bg: "bg-blue-100", subtitle: "Tell us about your incoming flight so we can arrange your pickup" },
  departure: { icon: PlaneTakeoff, color: "text-indigo-600", bg: "bg-indigo-100", subtitle: "Your return flight details for drop-off coordination" },
  accommodation: { icon: Hotel, color: "text-purple-600", bg: "bg-purple-100", subtitle: "Hotel and room preferences for your stay" },
  conference: { icon: Calendar, color: "text-emerald-600", bg: "bg-emerald-100", subtitle: "Conference attendance details" },
  transport: { icon: Car, color: "text-slate-600", bg: "bg-slate-200", subtitle: "Ground transportation and pickup needs" },
  visa: { icon: FileText, color: "text-orange-600", bg: "bg-orange-100", subtitle: "Passport and visa details — enter exactly as on your documents" },
  emergency: { icon: Phone, color: "text-red-600", bg: "bg-red-100", subtitle: "Who should we contact in case of emergency?" },
};

const BOOLEAN_FIELDS = new Set(["attending_conference", "airport_pickup_needed", "airport_dropoff_needed", "visa_required"]);
const DATE_FIELDS = new Set(["arrival_date", "departure_date", "check_in_date", "check_out_date"]);
const TIME_FIELDS = new Set(["arrival_time", "departure_time"]);
const TEXTAREA_FIELDS = new Set(["special_requests", "transport_notes"]);
const SELECT_FIELDS: Record<string, { value: string; label: string }[]> = {
  room_type: ROOM_TYPE_OPTIONS,
  visa_status: VISA_STATUS_OPTIONS,
};

const FIELD_HELP: Record<string, string> = {
  arrival_flight_number: "Found on your ticket or boarding pass",
  departure_flight_number: "Found on your ticket or boarding pass",
  arrival_airport: "e.g. Kotoka International (ACC)",
  departure_airport: "e.g. Kotoka International (ACC)",
  arrival_time: "Local Ghana time (GMT)",
  departure_time: "Local Ghana time (GMT)",
  passport_name: "Exactly as printed on your passport",
  passport_number: "Found on the data page of your passport",
  special_requests: "Dietary needs, accessibility requirements, etc.",
  transport_notes: "Any specific pickup or drop-off instructions",
};

const FIELD_PLACEHOLDERS: Record<string, string> = {
  arrival_airline: "e.g. Delta, British Airways",
  departure_airline: "e.g. Delta, British Airways",
  arrival_flight_number: "e.g. DL 1234",
  departure_flight_number: "e.g. DL 1234",
  arrival_airport: "e.g. Kotoka International (ACC)",
  departure_airport: "e.g. Kotoka International (ACC)",
  hotel_preference: "e.g. Marriott, Hilton",
  passport_name: "e.g. John Michael Smith",
  passport_number: "e.g. AB1234567",
  emergency_contact_name: "Full name",
  emergency_contact_phone: "e.g. +1 555 123 4567",
};

const BOOLEAN_CONFIG: Record<string, { label: string; description: string }> = {
  attending_conference: { label: "Attending Conference", description: "Will this person attend the conference sessions?" },
  airport_pickup_needed: { label: "Airport Pickup Needed", description: "Do you need a ride from the airport to your hotel?" },
  airport_dropoff_needed: { label: "Airport Drop-off Needed", description: "Do you need a ride from your hotel to the airport?" },
  visa_required: { label: "Visa Required", description: "Does this person need a visa to enter Ghana?" },
};

export function ItineraryForm({ itinerary, personName, backHref }: ItineraryFormProps) {
  const [completionPct, setCompletionPct] = useState(Number(itinerary.completion_pct) || 0);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const { register, getValues, setValue } = useForm({ defaultValues: buildDefaults(itinerary) });

  const saveField = useCallback(async (fieldName: string, value: unknown) => {
    if (debounceTimers.current[fieldName]) clearTimeout(debounceTimers.current[fieldName]);
    setSavingField(fieldName);
    const cleanValue = value === "" ? null : value;
    const result = await updateItineraryFields(itinerary.id, { [fieldName]: cleanValue });
    if (result.error) {
      toast.error(`Failed to save ${FIELD_LABELS[fieldName] || fieldName}`);
    } else if (result.data) {
      setCompletionPct(result.data.completion_pct);
      setLastSaved(new Date());
    }
    setSavingField(null);
  }, [itinerary.id]);

  const debouncedSave = useCallback((fieldName: string, value: unknown) => {
    if (debounceTimers.current[fieldName]) clearTimeout(debounceTimers.current[fieldName]);
    debounceTimers.current[fieldName] = setTimeout(() => saveField(fieldName, value), 300);
  }, [saveField]);

  const handleBlur = (fieldName: string) => saveField(fieldName, getValues(fieldName));
  const handleBooleanChange = (fieldName: string, checked: boolean) => { setValue(fieldName, checked); debouncedSave(fieldName, checked); };
  const handleSelectChange = (fieldName: string, value: string) => { setValue(fieldName, value); saveField(fieldName, value); };

  const sectionFilledCount = (fields: readonly string[]) => {
    const values = getValues();
    return fields.filter((f) => {
      if (BOOLEAN_FIELDS.has(f)) return false;
      const v = values[f];
      return v !== null && v !== undefined && v !== "";
    }).length;
  };

  const circumference = 2 * Math.PI * 15.5;
  const ringColor = completionPct >= 67 ? "stroke-emerald-500" : "stroke-blue-500";

  return (
    <div>
      {/* Sticky header */}
      <div className="sticky top-[52px] z-20 -mx-5 bg-white/90 backdrop-blur-xl px-5 py-3.5 border-b border-gray-200/80 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-4">
          {backHref && (
            <a href={backHref} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">&larr; Back</a>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-900 truncate">{personName}</h2>
            <p className="text-xs text-gray-400">Your changes are saved automatically</p>
          </div>

          {/* Save indicator */}
          <div className="flex items-center gap-1.5 text-sm text-gray-400 shrink-0" role="status" aria-live="polite">
            {savingField ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>Saving...</span></>
            ) : lastSaved ? (
              <><Check className="h-3.5 w-3.5 text-emerald-500" /><span className="text-emerald-600">Saved</span></>
            ) : null}
          </div>

          {/* Completion ring */}
          <div className="relative h-11 w-11 shrink-0">
            <svg className="h-11 w-11 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-gray-200" strokeWidth="2" />
              <circle cx="18" cy="18" r="15.5" fill="none" className={`${ringColor} transition-all duration-700 ease-out`} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${(completionPct / 100) * circumference} ${circumference}`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">{Math.round(completionPct)}%</span>
          </div>
        </div>
      </div>

      {/* Welcome text */}
      <div className="pt-8 pb-2">
        <p className="text-sm text-gray-500">
          Fill in what you know now — you can always come back and update later.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-6 pb-16 pt-4">
        {ITINERARY_SECTIONS.map((section) => {
          const config = SECTION_CONFIG[section.id] || { icon: FileText, color: "text-gray-600", bg: "bg-gray-100", subtitle: "" };
          const Icon = config.icon;
          const nonBooleanFields = section.fields.filter((f) => !BOOLEAN_FIELDS.has(f));
          const filled = sectionFilledCount(section.fields);
          const total = nonBooleanFields.length;
          const isComplete = filled === total && total > 0;

          return (
            <div key={section.id} className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              {/* Section header */}
              <div className="px-6 pt-6 pb-4 md:px-8">
                <div className="flex items-center gap-4">
                  <div className={cn("flex items-center justify-center h-11 w-11 rounded-xl", config.bg)}>
                    <Icon className={cn("h-5 w-5", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{config.subtitle}</p>
                  </div>
                  <span className={cn(
                    "text-xs font-semibold px-3 py-1.5 rounded-full",
                    isComplete ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                  )}>
                    {isComplete ? "✓ Complete" : `${filled}/${total}`}
                  </span>
                </div>
              </div>

              {/* Fields */}
              <div className="px-6 pb-6 md:px-8 md:pb-8">
                <div className="h-px bg-gray-100 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {section.fields.map((field) => (
                    <FieldRenderer
                      key={field}
                      field={field}
                      register={register}
                      getValues={getValues}
                      onBlur={handleBlur}
                      onBooleanChange={handleBooleanChange}
                      onSelectChange={handleSelectChange}
                      isSaving={savingField === field}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FieldRenderer({
  field, register, getValues, onBlur, onBooleanChange, onSelectChange, isSaving,
}: {
  field: string;
  register: ReturnType<typeof useForm>["register"];
  getValues: ReturnType<typeof useForm>["getValues"];
  onBlur: (field: string) => void;
  onBooleanChange: (field: string, checked: boolean) => void;
  onSelectChange: (field: string, value: string) => void;
  isSaving: boolean;
}) {
  const label = FIELD_LABELS[field] || field;
  const help = FIELD_HELP[field];
  const placeholder = FIELD_PLACEHOLDERS[field] || "";

  // Boolean toggles
  if (BOOLEAN_FIELDS.has(field)) {
    const config = BOOLEAN_CONFIG[field];
    const isChecked = !!getValues(field);
    return (
      <div className="md:col-span-2">
        <button
          type="button"
          onClick={() => onBooleanChange(field, !isChecked)}
          className={cn(
            "w-full rounded-xl border-2 px-5 py-4 flex items-center justify-between gap-4 transition-all text-left",
            isChecked
              ? "border-emerald-300 bg-emerald-50/50"
              : "border-gray-200 bg-white hover:border-gray-300"
          )}
        >
          <div>
            <p className="text-[15px] font-medium text-gray-900">{config?.label || label}</p>
            <p className="text-sm text-gray-500 mt-0.5">{config?.description || ""}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            <div className={cn(
              "text-sm font-semibold px-3 py-1 rounded-lg transition-colors",
              isChecked ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"
            )}>
              {isChecked ? "Yes" : "No"}
            </div>
          </div>
        </button>
      </div>
    );
  }

  // Select fields
  if (SELECT_FIELDS[field]) {
    return (
      <div className="space-y-2">
        <label htmlFor={field} className="text-[15px] font-medium text-gray-900 flex items-center gap-2">
          {label}
          {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
        </label>
        <select
          id={field}
          className="w-full h-12 rounded-xl bg-white border border-gray-300 px-4 text-base text-gray-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
          value={getValues(field) || ""}
          onChange={(e) => onSelectChange(field, e.target.value)}
        >
          <option value="">Select...</option>
          {SELECT_FIELDS[field].map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {help && <p className="text-sm text-gray-400">{help}</p>}
      </div>
    );
  }

  // Skip conference_days
  if (field === "conference_days") return null;

  // Textareas
  if (TEXTAREA_FIELDS.has(field)) {
    return (
      <div className="md:col-span-2 space-y-2">
        <label htmlFor={field} className="text-[15px] font-medium text-gray-900 flex items-center gap-2">
          {label}
          {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
        </label>
        <Textarea
          id={field}
          rows={3}
          className="text-base resize-none rounded-xl border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 px-4 py-3"
          {...register(field)}
          onBlur={() => onBlur(field)}
          placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
        />
        {help && <p className="text-sm text-gray-400">{help}</p>}
      </div>
    );
  }

  // Standard inputs
  const inputType = DATE_FIELDS.has(field) ? "date" : TIME_FIELDS.has(field) ? "time" : "text";

  return (
    <div className="space-y-2">
      <label htmlFor={field} className="text-[15px] font-medium text-gray-900 flex items-center gap-2">
        {label}
        {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
      </label>
      <input
        id={field}
        type={inputType}
        className="w-full h-12 rounded-xl bg-white border border-gray-300 px-4 text-base text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
        {...register(field)}
        onBlur={() => onBlur(field)}
        placeholder={placeholder || (inputType === "text" ? label : undefined)}
      />
      {help && <p className="text-sm text-gray-400">{help}</p>}
    </div>
  );
}

function buildDefaults(itinerary: Record<string, unknown>) {
  const defaults: Record<string, unknown> = {};
  for (const section of ITINERARY_SECTIONS) {
    for (const field of section.fields) {
      const val = itinerary[field];
      defaults[field] = BOOLEAN_FIELDS.has(field) ? (val ?? false) : (val ?? "");
    }
  }
  return defaults;
}
