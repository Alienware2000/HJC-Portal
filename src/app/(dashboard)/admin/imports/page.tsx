import { ImportWizard } from "@/components/admin/import-wizard";
import { Users, Info } from "lucide-react";

export const metadata = { title: "Import Roster — Healing Jesus Conference" };

export default function ImportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Import Roster</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-3xl">
          Bulk-create board members from a CSV. Each row creates one member, generates their access code, and prepares an empty itinerary they fill in after logging in.
        </p>
      </div>

      {/* What this is for */}
      <div className="rounded-xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)]">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Users className="h-[18px] w-[18px] text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-gray-900">When to use this</p>
            <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
              You have a roster of names (and ideally contact info) and want to set everyone up at once instead of generating codes one by one. Re-uploading later with the same access codes <em>updates</em> existing members rather than duplicating.
            </p>
            <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">
              <strong className="text-gray-700">You don&apos;t need to provide travel details.</strong> Each member fills in their own arrival, hotel, visa, and emergency contact info after they log in with their access code.
            </p>
          </div>
        </div>
      </div>

      {/* Required + recommended fields */}
      <div className="rounded-xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)] space-y-4">
        <p className="text-[14px] font-semibold text-gray-900">CSV columns</p>

        <FieldGroup
          tone="required"
          title="Required"
          description="Without this column, nothing imports."
          fields={[{ name: "board_member_name", aliases: "NAME, full name, member" }]}
        />

        <FieldGroup
          tone="recommended"
          title="Recommended (directory)"
          description="What admins and staff see in the members directory. Easier to provide once than chase later."
          fields={[
            { name: "country" },
            { name: "city" },
            { name: "language" },
            { name: "ministry", aliases: "church, organization" },
            { name: "phone", aliases: "phone number" },
            { name: "contact_email", aliases: "email, email address" },
            { name: "year_joined", aliases: "yr joined" },
          ]}
          note="Multiple emails: separate addresses in the contact_email cell with a comma or semicolon — all are kept."
        />

        <FieldGroup
          tone="optional"
          title="Optional"
          description="Override the auto-generated access code if you want a specific one. Surnames collide; the importer adds a random suffix when they do."
          fields={[{ name: "access_code", aliases: "code, login code" }]}
        />

        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer select-none text-[13px] font-medium text-gray-500 hover:text-gray-700">
            <Info className="h-3.5 w-3.5" />
            Advanced: pre-populating travel/itinerary fields
            <span className="text-gray-300 group-open:rotate-90 transition-transform inline-block">›</span>
          </summary>
          <div className="mt-3 pl-5 border-l-2 border-gray-100 space-y-2 text-[13px] text-gray-500 leading-relaxed">
            <p>
              You can also include any itinerary field (<code className="font-mono text-[12px] bg-gray-100 px-1 rounded">arrival_date</code>, <code className="font-mono text-[12px] bg-gray-100 px-1 rounded">hotel_preference</code>, <code className="font-mono text-[12px] bg-gray-100 px-1 rounded">passport_number</code>, etc.) if you already have it from another source — for example, a travel agency or last year&apos;s data.
            </p>
            <p>
              <strong className="text-gray-700">Most of the time, leave these out.</strong> Members enter their own travel details, and pre-filling can confuse them when they review.
            </p>
          </div>
        </details>

        <div className="text-[12.5px] text-gray-400 pt-2 border-t border-gray-100">
          Column names match case-insensitively. You confirm and adjust the mapping in the wizard&apos;s next step.
        </div>
      </div>

      {/* Wizard */}
      <ImportWizard />
    </div>
  );
}

function FieldGroup({
  tone,
  title,
  description,
  fields,
  note,
}: {
  tone: "required" | "recommended" | "optional";
  title: string;
  description: string;
  fields: { name: string; aliases?: string }[];
  note?: string;
}) {
  const toneStyles = {
    required: {
      label: "bg-red-50 text-red-700 ring-red-100",
      chip: "bg-red-50 text-red-800 ring-red-100",
    },
    recommended: {
      label: "bg-blue-50 text-blue-700 ring-blue-100",
      chip: "bg-blue-50 text-blue-800 ring-blue-100",
    },
    optional: {
      label: "bg-gray-100 text-gray-600 ring-gray-200",
      chip: "bg-gray-100 text-gray-700 ring-gray-200",
    },
  }[tone];

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded ring-1 ring-inset ${toneStyles.label}`}>{title}</span>
        <span className="text-[13px] text-gray-500">{description}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {fields.map((f) => (
          <span key={f.name} className={`inline-flex items-center text-[12px] font-mono px-2 py-0.5 rounded ring-1 ring-inset ${toneStyles.chip}`} title={f.aliases ? `Also matches: ${f.aliases}` : undefined}>
            {f.name}
          </span>
        ))}
      </div>
      {note && <p className="text-[12.5px] text-gray-500 mt-2 leading-relaxed">{note}</p>}
    </div>
  );
}
