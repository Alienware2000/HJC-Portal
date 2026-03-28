-- Add transport_notes to the completion calculation (total becomes 21, already counted above)
-- This migration is a no-op since the previous fix already handles 21 fields including special_requests
-- but we add transport_notes as field #21 replacing the duplicate special_requests count

CREATE OR REPLACE FUNCTION public.compute_completion_pct()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  filled int := 0;
  total int := 21;
  pct numeric(5,2);
  bm_avg numeric(5,2);
BEGIN
  -- Arrival (5)
  IF NEW.arrival_date IS NOT NULL AND NEW.arrival_date != '' THEN filled := filled + 1; END IF;
  IF NEW.arrival_airline IS NOT NULL AND NEW.arrival_airline != '' THEN filled := filled + 1; END IF;
  IF NEW.arrival_flight_number IS NOT NULL AND NEW.arrival_flight_number != '' THEN filled := filled + 1; END IF;
  IF NEW.arrival_time IS NOT NULL AND NEW.arrival_time != '' THEN filled := filled + 1; END IF;
  IF NEW.arrival_airport IS NOT NULL AND NEW.arrival_airport != '' THEN filled := filled + 1; END IF;

  -- Departure (5)
  IF NEW.departure_date IS NOT NULL AND NEW.departure_date != '' THEN filled := filled + 1; END IF;
  IF NEW.departure_airline IS NOT NULL AND NEW.departure_airline != '' THEN filled := filled + 1; END IF;
  IF NEW.departure_flight_number IS NOT NULL AND NEW.departure_flight_number != '' THEN filled := filled + 1; END IF;
  IF NEW.departure_time IS NOT NULL AND NEW.departure_time != '' THEN filled := filled + 1; END IF;
  IF NEW.departure_airport IS NOT NULL AND NEW.departure_airport != '' THEN filled := filled + 1; END IF;

  -- Accommodation (5)
  IF NEW.hotel_preference IS NOT NULL AND NEW.hotel_preference != '' THEN filled := filled + 1; END IF;
  IF NEW.room_type IS NOT NULL AND NEW.room_type != '' THEN filled := filled + 1; END IF;
  IF NEW.check_in_date IS NOT NULL AND NEW.check_in_date != '' THEN filled := filled + 1; END IF;
  IF NEW.check_out_date IS NOT NULL AND NEW.check_out_date != '' THEN filled := filled + 1; END IF;
  IF NEW.special_requests IS NOT NULL AND NEW.special_requests != '' THEN filled := filled + 1; END IF;

  -- Transport (1)
  IF NEW.transport_notes IS NOT NULL AND NEW.transport_notes != '' THEN filled := filled + 1; END IF;

  -- Visa & Docs (2)
  IF NEW.passport_name IS NOT NULL AND NEW.passport_name != '' THEN filled := filled + 1; END IF;
  IF NEW.visa_status IS NOT NULL AND NEW.visa_status != '' THEN filled := filled + 1; END IF;

  -- Emergency (2)
  IF NEW.emergency_contact_name IS NOT NULL AND NEW.emergency_contact_name != '' THEN filled := filled + 1; END IF;
  IF NEW.emergency_contact_phone IS NOT NULL AND NEW.emergency_contact_phone != '' THEN filled := filled + 1; END IF;

  -- Passport number (1) -- total = 5+5+5+1+2+2+1 = 21
  IF NEW.passport_number IS NOT NULL AND NEW.passport_number != '' THEN filled := filled + 1; END IF;

  pct := round((filled::numeric / total::numeric) * 100, 2);
  NEW.completion_pct := pct;

  -- Update board member aggregate completion
  IF TG_OP = 'INSERT' THEN
    SELECT avg(val) INTO bm_avg FROM (
      SELECT completion_pct as val FROM itineraries WHERE board_member_id = NEW.board_member_id
      UNION ALL
      SELECT pct as val
    ) sub;
  ELSE
    SELECT avg(val) INTO bm_avg FROM (
      SELECT completion_pct as val FROM itineraries WHERE board_member_id = NEW.board_member_id AND id != NEW.id
      UNION ALL
      SELECT pct as val
    ) sub;
  END IF;

  UPDATE board_members SET completion_pct = coalesce(bm_avg, pct) WHERE id = NEW.board_member_id;

  RETURN NEW;
END;
$$;
