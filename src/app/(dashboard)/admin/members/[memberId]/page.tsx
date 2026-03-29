import { notFound } from "next/navigation";
import { getMemberDetail } from "@/actions/members";
import { MemberDetailView } from "@/components/shared/member-detail-view";

export const metadata = { title: "Member Details — Healing Jesus Conference" };

export default async function MemberDetailPage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  const { data: member, error } = await getMemberDetail(memberId);
  if (error || !member) notFound();

  return (
    <MemberDetailView
      member={member}
      backHref="/admin/members"
      backLabel="Members"
    />
  );
}
