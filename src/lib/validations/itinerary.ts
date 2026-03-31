import { z } from "zod";

export const itinerarySchema = z.object({
  // Travel - Arrival
  arrival_date: z.string().nullable().optional(),
  arrival_airline: z.string().max(100).nullable().optional(),
  arrival_flight_number: z.string().max(20).nullable().optional(),
  arrival_time: z.string().nullable().optional(),
  arrival_airport: z.string().max(100).nullable().optional(),

  // Travel - Departure
  departure_date: z.string().nullable().optional(),
  departure_airline: z.string().max(100).nullable().optional(),
  departure_flight_number: z.string().max(20).nullable().optional(),
  departure_time: z.string().nullable().optional(),
  departure_airport: z.string().max(100).nullable().optional(),

  // Accommodation
  hotel_preference: z.string().max(200).nullable().optional(),
  room_type: z.string().nullable().optional(),
  check_in_date: z.string().nullable().optional(),
  check_out_date: z.string().nullable().optional(),
  special_requests: z.string().max(1000).nullable().optional(),

  // Conference
  attending_conference: z.boolean().optional(),
  conference_days: z.array(z.string()).nullable().optional(),

  // Transport
  airport_pickup_needed: z.boolean().optional(),
  airport_dropoff_needed: z.boolean().optional(),
  transport_notes: z.string().max(500).nullable().optional(),

  // Visa & Documents
  passport_name: z.string().max(200).nullable().optional(),
  passport_number: z.string().max(50).nullable().optional(),
  visa_required: z.boolean().optional(),
  visa_status: z.string().nullable().optional(),

  // Emergency
  emergency_contact_name: z.string().max(200).nullable().optional(),
  emergency_contact_phone: z.string().max(50).nullable().optional(),
});

export type ItineraryFormData = z.infer<typeof itinerarySchema>;

export const ITINERARY_SECTIONS = [
  {
    id: "arrival",
    title: "Arrival Details",
    fields: [
      "arrival_date",
      "arrival_airline",
      "arrival_flight_number",
      "arrival_time",
      "arrival_airport",
    ],
  },
  {
    id: "departure",
    title: "Departure Details",
    fields: [
      "departure_date",
      "departure_airline",
      "departure_flight_number",
      "departure_time",
      "departure_airport",
    ],
  },
  {
    id: "accommodation",
    title: "Accommodation",
    fields: [
      "hotel_preference",
      "room_type",
      "check_in_date",
      "check_out_date",
      "special_requests",
    ],
  },
  {
    id: "conference",
    title: "Conference",
    fields: ["attending_conference", "conference_days"],
  },
  {
    id: "transport",
    title: "Ground Transport",
    fields: [
      "airport_pickup_needed",
      "airport_dropoff_needed",
      "transport_notes",
    ],
  },
  {
    id: "visa",
    title: "Visa & Documents",
    fields: ["passport_name", "passport_number", "visa_required", "visa_status"],
  },
  {
    id: "emergency",
    title: "Emergency Contact",
    fields: ["emergency_contact_name", "emergency_contact_phone"],
  },
] as const;

export const FIELD_LABELS: Record<string, string> = {
  arrival_date: "Arrival Date",
  arrival_airline: "Airline",
  arrival_flight_number: "Flight Number",
  arrival_time: "Arrival Time",
  arrival_airport: "Airport",
  departure_date: "Departure Date",
  departure_airline: "Airline",
  departure_flight_number: "Flight Number",
  departure_time: "Departure Time",
  departure_airport: "Airport",
  hotel_preference: "Hotel Preference",
  room_type: "Room Type",
  check_in_date: "Check-in Date",
  check_out_date: "Check-out Date",
  special_requests: "Special Requests",
  attending_conference: "Attending Conference",
  conference_days: "Conference Days",
  airport_pickup_needed: "Airport Pickup Needed",
  airport_dropoff_needed: "Airport Drop-off Needed",
  transport_notes: "Transport Notes",
  passport_name: "Name on Passport",
  passport_number: "Passport Number",
  visa_required: "Visa Required",
  visa_status: "Visa Status",
  emergency_contact_name: "Contact Name",
  emergency_contact_phone: "Contact Phone",
};

export const partyMemberSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  relationship: z.enum(["spouse", "child", "guest", "other"], { message: "Select a relationship" }),
});

export type PartyMemberInput = z.infer<typeof partyMemberSchema>;

export const RELATIONSHIP_OPTIONS = [
  { value: "spouse", label: "Spouse" },
  { value: "child", label: "Child" },
  { value: "guest", label: "Guest" },
  { value: "other", label: "Other" },
];

export const ROOM_TYPE_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
  { value: "suite", label: "Suite" },
  { value: "shared", label: "Shared" },
];

export const VISA_STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
];
