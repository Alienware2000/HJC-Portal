export const IMPORTABLE_FIELDS = [
  { value: "__skip__", label: "— Skip this column —" },
  { value: "board_member_name", label: "Board Member Name" },
  { value: "access_code", label: "Access Code" },
  { value: "phone", label: "Phone Number" },
  { value: "contact_email", label: "Contact Email" },
  { value: "country", label: "Country" },
  { value: "city", label: "City" },
  { value: "language", label: "Language" },
  { value: "ministry", label: "Ministry" },
  { value: "year_joined", label: "Year Joined" },
  { value: "arrival_date", label: "Arrival Date" },
  { value: "arrival_airline", label: "Arrival Airline" },
  { value: "arrival_flight_number", label: "Arrival Flight Number" },
  { value: "arrival_time", label: "Arrival Time" },
  { value: "arrival_airport", label: "Arrival Airport" },
  { value: "departure_date", label: "Departure Date" },
  { value: "departure_airline", label: "Departure Airline" },
  { value: "departure_flight_number", label: "Departure Flight Number" },
  { value: "departure_time", label: "Departure Time" },
  { value: "departure_airport", label: "Departure Airport" },
  { value: "hotel_preference", label: "Hotel Preference" },
  { value: "room_type", label: "Room Type" },
  { value: "check_in_date", label: "Check-in Date" },
  { value: "check_out_date", label: "Check-out Date" },
  { value: "special_requests", label: "Special Requests" },
  { value: "attending_conference", label: "Attending Conference" },
  { value: "airport_pickup_needed", label: "Airport Pickup" },
  { value: "airport_dropoff_needed", label: "Airport Drop-off" },
  { value: "transport_notes", label: "Transport Notes" },
  { value: "passport_name", label: "Passport Name" },
  { value: "passport_number", label: "Passport Number" },
  { value: "visa_required", label: "Visa Required" },
  { value: "visa_status", label: "Visa Status" },
  { value: "emergency_contact_name", label: "Emergency Contact Name" },
  { value: "emergency_contact_phone", label: "Emergency Contact Phone" },
];

const FIELD_ALIASES: Record<string, string[]> = {
  board_member_name: ["name", "member", "board member", "full name", "board_member_name", "member_name"],
  access_code: ["code", "access code", "access_code", "login_code", "login code"],
  phone: ["phone", "phone number", "phone_number", "mobile", "tel", "telephone", "contact number"],
  contact_email: ["email", "email address", "email_address", "contact email", "contact_email", "e-mail"],
  country: ["country", "nation"],
  city: ["city", "town", "location"],
  language: ["language", "lang", "preferred language"],
  ministry: ["ministry", "church", "organization", "organisation", "ministry name", "church name"],
  year_joined: ["yr joined", "yr_joined", "year joined", "year_joined", "joined", "joined year", "year"],
  arrival_date: ["arrival date", "arrival_date", "arrive date"],
  departure_date: ["departure date", "departure_date", "depart date"],
  hotel_preference: ["hotel", "hotel preference", "hotel_preference"],
  passport_name: ["passport name", "passport_name", "name on passport"],
  passport_number: ["passport number", "passport_number", "passport no"],
  emergency_contact_name: ["emergency contact", "emergency_contact_name", "emergency name"],
  emergency_contact_phone: ["emergency phone", "emergency_contact_phone"],
};

export function autoMapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const header of headers) {
    const normalized = header.toLowerCase().trim().replace(/[_\s-]+/g, "_");

    // Direct match
    const directMatch = IMPORTABLE_FIELDS.find(
      (f) => f.value !== "__skip__" && f.value === normalized
    );
    if (directMatch) {
      mapping[header] = directMatch.value;
      continue;
    }

    // Alias match (exact-equal first to avoid false substring matches like
    // "email address" → "address" or "phone" → "passport phone")
    let found = false;
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (aliases.some((a) => normalized === a.replace(/\s+/g, "_"))) {
        mapping[header] = field;
        found = true;
        break;
      }
    }
    if (!found) {
      for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
        if (aliases.some((a) => normalized.includes(a.replace(/\s+/g, "_")))) {
          mapping[header] = field;
          found = true;
          break;
        }
      }
    }

    if (!found) {
      // Substring match against canonical field names
      const substringMatch = IMPORTABLE_FIELDS.find(
        (f) => f.value !== "__skip__" && normalized.includes(f.value.replace(/_/g, ""))
      );
      mapping[header] = substringMatch?.value || "__skip__";
    }
  }

  return mapping;
}
