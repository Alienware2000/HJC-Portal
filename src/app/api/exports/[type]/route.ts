import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCSV } from "@/lib/csv";
import {
  getFullExportData,
  getRoomingData,
  getPickupData,
} from "@/actions/exports";

const EXPORT_CONFIGS: Record<
  string,
  {
    getData: () => Promise<Record<string, unknown>[]>;
    columns: { key: string; label: string }[];
    filename: string;
  }
> = {
  "all-members": {
    getData: getFullExportData,
    columns: [
      { key: "board_member_name", label: "Board Member" },
      { key: "access_code", label: "Access Code" },
      { key: "board_member_email", label: "Email" },
      { key: "board_member_phone", label: "Phone" },
      { key: "party_member_name", label: "Party Member" },
      { key: "relationship", label: "Relationship" },
      { key: "arrival_date", label: "Arrival Date" },
      { key: "arrival_airline", label: "Arrival Airline" },
      { key: "arrival_flight_number", label: "Arrival Flight" },
      { key: "arrival_time", label: "Arrival Time" },
      { key: "arrival_airport", label: "Arrival Airport" },
      { key: "departure_date", label: "Departure Date" },
      { key: "departure_airline", label: "Departure Airline" },
      { key: "departure_flight_number", label: "Departure Flight" },
      { key: "departure_time", label: "Departure Time" },
      { key: "departure_airport", label: "Departure Airport" },
      { key: "hotel_preference", label: "Hotel" },
      { key: "room_type", label: "Room Type" },
      { key: "check_in_date", label: "Check-in" },
      { key: "check_out_date", label: "Check-out" },
      { key: "special_requests", label: "Special Requests" },
      { key: "passport_name", label: "Passport Name" },
      { key: "passport_number", label: "Passport Number" },
      { key: "visa_required", label: "Visa Required" },
      { key: "visa_status", label: "Visa Status" },
      { key: "emergency_contact_name", label: "Emergency Contact" },
      { key: "emergency_contact_phone", label: "Emergency Phone" },
      { key: "airport_pickup_needed", label: "Pickup Needed" },
      { key: "airport_dropoff_needed", label: "Dropoff Needed" },
      { key: "transport_notes", label: "Transport Notes" },
      { key: "completion_pct", label: "Completion %" },
    ],
    filename: "members-export",
  },
  "rooming-list": {
    getData: getRoomingData,
    columns: [
      { key: "board_member_name", label: "Board Member" },
      { key: "party_member_name", label: "Guest Name" },
      { key: "relationship", label: "Relationship" },
      { key: "hotel_preference", label: "Hotel" },
      { key: "room_type", label: "Room Type" },
      { key: "check_in_date", label: "Check-in" },
      { key: "check_out_date", label: "Check-out" },
      { key: "special_requests", label: "Special Requests" },
    ],
    filename: "rooming-list",
  },
  "pickup-schedule": {
    getData: getPickupData,
    columns: [
      { key: "board_member_name", label: "Board Member" },
      { key: "party_member_name", label: "Passenger" },
      { key: "arrival_date", label: "Arrival Date" },
      { key: "arrival_airline", label: "Airline" },
      { key: "arrival_flight_number", label: "Flight" },
      { key: "arrival_time", label: "Arrival Time" },
      { key: "arrival_airport", label: "Airport" },
      { key: "airport_pickup_needed", label: "Pickup Needed" },
      { key: "transport_notes", label: "Notes" },
    ],
    filename: "pickup-schedule",
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;

  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "admin") {
    return new Response("Unauthorized", { status: 401 });
  }

  const config = EXPORT_CONFIGS[type];
  if (!config) {
    return new Response("Invalid export type", { status: 400 });
  }

  let data;
  try {
    data = await config.getData();
  } catch {
    return new Response("Failed to fetch export data", { status: 500 });
  }

  const csv = generateCSV(data, config.columns);
  const date = new Date().toISOString().split("T")[0];

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${config.filename}-${date}.csv"`,
    },
  });
}
