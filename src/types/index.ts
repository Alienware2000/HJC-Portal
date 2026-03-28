export interface Event {
  id: string;
  year: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  role: "board_member" | "admin" | "staff";
  full_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccessCode {
  id: string;
  event_id: string;
  code: string;
  board_member_name: string;
  board_member_id: string | null;
  is_used: boolean;
  created_at: string;
  updated_at: string;
}

export interface BoardMember {
  id: string;
  event_id: string;
  user_id: string;
  access_code_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  completion_pct: number;
  created_at: string;
  updated_at: string;
}

export interface PartyMember {
  id: string;
  board_member_id: string;
  name: string;
  relationship: "self" | "spouse" | "child" | "guest" | "other";
  created_at: string;
  updated_at: string;
}

export interface Itinerary {
  id: string;
  party_member_id: string;
  board_member_id: string;
  event_id: string;

  arrival_date: string | null;
  arrival_airline: string | null;
  arrival_flight_number: string | null;
  arrival_time: string | null;
  arrival_airport: string | null;

  departure_date: string | null;
  departure_airline: string | null;
  departure_flight_number: string | null;
  departure_time: string | null;
  departure_airport: string | null;

  hotel_preference: string | null;
  room_type: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  special_requests: string | null;

  attending_conference: boolean;
  conference_days: string[] | null;

  airport_pickup_needed: boolean;
  airport_dropoff_needed: boolean;
  transport_notes: string | null;

  passport_name: string | null;
  passport_number: string | null;
  visa_required: boolean;
  visa_status: string | null;

  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;

  completion_pct: number;
  created_at: string;
  updated_at: string;
}

export interface ChangeLog {
  id: string;
  table_name: string;
  record_id: string;
  user_id: string | null;
  changes: Record<string, { old: unknown; new: unknown }>;
  created_at: string;
}

export interface NotificationQueue {
  id: string;
  recipient_email: string;
  subject: string;
  body: string;
  status: "pending" | "sent" | "failed";
  created_at: string;
  sent_at: string | null;
}
