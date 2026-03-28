import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ItineraryForm } from "@/components/itinerary/itinerary-form";

export const metadata = { title: "Party Member Itinerary — Healing Jesus Conference" };

export default async function PartyMemberItineraryPage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify this party member belongs to the current user's board member
  const { data: partyMember } = await supabase
    .from("party_members")
    .select("*, board_members!inner(user_id)")
    .eq("id", personId)
    .single();

  if (!partyMember) notFound();

  // If self, redirect to own itinerary page
  if (partyMember.relationship === "self") redirect("/member/itinerary");

  const { data: itinerary } = await supabase
    .from("itineraries")
    .select("*")
    .eq("party_member_id", personId)
    .single();

  if (!itinerary) notFound();

  return (
    <ItineraryForm
      itinerary={itinerary}
      personName={partyMember.name}
      backHref="/member/party"
    />
  );
}
