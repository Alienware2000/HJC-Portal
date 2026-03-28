-- 1. Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data ->> 'role', 'board_member'),
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Custom JWT hook: inject user_role into access token
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_role text;
BEGIN
  claims := event -> 'claims';

  SELECT role INTO user_role FROM public.profiles WHERE id = (event ->> 'user_id')::uuid;

  IF user_role IS NULL THEN
    user_role := 'board_member';
  END IF;

  claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;

-- Grant execute to supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON TABLE public.profiles TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- 3. Compute completion percentage on itinerary changes
CREATE OR REPLACE FUNCTION public.compute_completion_pct()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  filled int := 0;
  total int := 20;
  pct numeric(5,2);
  bm_avg numeric(5,2);
BEGIN
  -- Count filled fields (20 countable fields)
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

  -- Accommodation (4)
  IF NEW.hotel_preference IS NOT NULL AND NEW.hotel_preference != '' THEN filled := filled + 1; END IF;
  IF NEW.room_type IS NOT NULL AND NEW.room_type != '' THEN filled := filled + 1; END IF;
  IF NEW.check_in_date IS NOT NULL AND NEW.check_in_date != '' THEN filled := filled + 1; END IF;
  IF NEW.check_out_date IS NOT NULL AND NEW.check_out_date != '' THEN filled := filled + 1; END IF;

  -- Visa & Docs (2)
  IF NEW.passport_name IS NOT NULL AND NEW.passport_name != '' THEN filled := filled + 1; END IF;
  IF NEW.visa_status IS NOT NULL AND NEW.visa_status != '' THEN filled := filled + 1; END IF;

  -- Emergency (2)
  IF NEW.emergency_contact_name IS NOT NULL AND NEW.emergency_contact_name != '' THEN filled := filled + 1; END IF;
  IF NEW.emergency_contact_phone IS NOT NULL AND NEW.emergency_contact_phone != '' THEN filled := filled + 1; END IF;

  -- Special requests (1)
  IF NEW.special_requests IS NOT NULL AND NEW.special_requests != '' THEN filled := filled + 1; END IF;

  -- Passport number (1)
  IF NEW.passport_number IS NOT NULL AND NEW.passport_number != '' THEN filled := filled + 1; END IF;

  pct := round((filled::numeric / total::numeric) * 100, 2);
  NEW.completion_pct := pct;

  -- Update board member's average completion
  IF TG_OP = 'UPDATE' THEN
    SELECT coalesce(avg(i.completion_pct), 0) INTO bm_avg
    FROM itineraries i
    WHERE i.board_member_id = NEW.board_member_id
    AND i.id != NEW.id;

    -- Include this record's new value
    IF bm_avg = 0 THEN
      bm_avg := pct;
    ELSE
      SELECT avg(val) INTO bm_avg FROM (
        SELECT completion_pct as val FROM itineraries WHERE board_member_id = NEW.board_member_id AND id != NEW.id
        UNION ALL
        SELECT pct as val
      ) sub;
    END IF;

    UPDATE board_members SET completion_pct = bm_avg WHERE id = NEW.board_member_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER compute_itinerary_completion
  BEFORE INSERT OR UPDATE ON itineraries
  FOR EACH ROW EXECUTE FUNCTION public.compute_completion_pct();

-- 4. Log itinerary changes
CREATE OR REPLACE FUNCTION public.log_itinerary_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  changes jsonb := '{}';
  col text;
  old_val text;
  new_val text;
  skip_cols text[] := ARRAY['id', 'party_member_id', 'board_member_id', 'event_id', 'created_at', 'updated_at', 'completion_pct'];
BEGIN
  FOR col IN SELECT column_name FROM information_schema.columns WHERE table_name = 'itineraries' AND table_schema = 'public'
  LOOP
    IF col = ANY(skip_cols) THEN CONTINUE; END IF;

    EXECUTE format('SELECT ($1).%I::text', col) INTO old_val USING OLD;
    EXECUTE format('SELECT ($1).%I::text', col) INTO new_val USING NEW;

    IF old_val IS DISTINCT FROM new_val THEN
      changes := changes || jsonb_build_object(col, jsonb_build_object('old', coalesce(old_val, ''), 'new', coalesce(new_val, '')));
    END IF;
  END LOOP;

  IF changes != '{}' THEN
    INSERT INTO change_log (table_name, record_id, user_id, changes)
    VALUES ('itineraries', NEW.id, auth.uid(), changes);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER log_itinerary_updates
  AFTER UPDATE ON itineraries
  FOR EACH ROW EXECUTE FUNCTION public.log_itinerary_changes();

-- 5. Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_access_codes_updated_at BEFORE UPDATE ON access_codes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_board_members_updated_at BEFORE UPDATE ON board_members FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_party_members_updated_at BEFORE UPDATE ON party_members FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_itineraries_updated_at BEFORE UPDATE ON itineraries FOR EACH ROW EXECUTE FUNCTION set_updated_at();
