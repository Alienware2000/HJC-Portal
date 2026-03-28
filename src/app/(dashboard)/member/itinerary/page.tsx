import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ItineraryForm } from "@/components/itinerary/itinerary-form";

export const metadata = { title: "My Itinerary — Healing Jesus Conference" };

export default async function ItineraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: boardMember } = await supabase
    .from("board_members")
    .select("id, name")
    .eq("user_id", user.id)
    .single();

  if (!boardMember) return <p className="text-sm text-gray-500 py-16 text-center">Board member not found.</p>;

  const { data: partyMember } = await supabase
    .from("party_members")
    .select("id")
    .eq("board_member_id", boardMember.id)
    .eq("relationship", "self")
    .single();

  if (!partyMember) return <p className="text-sm text-gray-500 py-16 text-center">Self party member not found.</p>;

  const { data: itinerary } = await supabase
    .from("itineraries")
    .select("*")
    .eq("party_member_id", partyMember.id)
    .single();

  if (!itinerary) return <p className="text-sm text-gray-500 py-16 text-center">Itinerary not found.</p>;

  return <ItineraryForm itinerary={itinerary} personName={boardMember.name} />;
}
