import { SettingsPanel } from "@/components/shared/settings-panel";

export const metadata = { title: "Settings — Healing Jesus Conference" };

export default function StaffSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your account settings.</p>
      </div>
      <SettingsPanel />
    </div>
  );
}
