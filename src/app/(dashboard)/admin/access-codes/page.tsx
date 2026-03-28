import { getAccessCodes } from "@/actions/access-codes";
import { AccessCodesPanel } from "@/components/admin/access-codes-panel";

export const metadata = { title: "Access Codes — Healing Jesus Conference" };

export default async function AccessCodesPage() {
  const { data: codes } = await getAccessCodes();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">Access Codes</h2>
        <p className="text-sm text-gray-500 mt-1">Generate and manage board member login codes.</p>
      </div>
      <AccessCodesPanel codes={codes} />
    </div>
  );
}
