-- Create custom types
CREATE TYPE user_role AS ENUM ('board_member', 'admin', 'staff');

-- 1. Events
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL UNIQUE,
  name text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'board_member' CHECK (role IN ('board_member', 'admin', 'staff')),
  full_name text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Access codes
CREATE TABLE public.access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  code text NOT NULL,
  board_member_name text NOT NULL,
  board_member_id uuid,
  is_used boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, code)
);

-- 4. Board members
CREATE TABLE public.board_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_code_id uuid,
  name text NOT NULL,
  email text,
  phone text,
  completion_pct numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Add FK after both tables exist
ALTER TABLE access_codes
  ADD CONSTRAINT fk_access_codes_board_member
  FOREIGN KEY (board_member_id) REFERENCES board_members(id) ON DELETE SET NULL;

ALTER TABLE board_members
  ADD CONSTRAINT board_members_access_code_id_fkey
  FOREIGN KEY (access_code_id) REFERENCES access_codes(id) ON DELETE SET NULL;

-- 5. Party members
CREATE TABLE public.party_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_member_id uuid NOT NULL REFERENCES board_members(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text NOT NULL CHECK (relationship IN ('self', 'spouse', 'child', 'guest', 'other')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Itineraries (wide table)
CREATE TABLE public.itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_member_id uuid NOT NULL UNIQUE REFERENCES party_members(id) ON DELETE CASCADE,
  board_member_id uuid NOT NULL REFERENCES board_members(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Arrival
  arrival_date text,
  arrival_airline text,
  arrival_flight_number text,
  arrival_time text,
  arrival_airport text,

  -- Departure
  departure_date text,
  departure_airline text,
  departure_flight_number text,
  departure_time text,
  departure_airport text,

  -- Accommodation
  hotel_preference text,
  room_type text,
  check_in_date text,
  check_out_date text,
  special_requests text,

  -- Conference
  attending_conference boolean DEFAULT false,
  conference_days text[],

  -- Transport
  airport_pickup_needed boolean DEFAULT false,
  airport_dropoff_needed boolean DEFAULT false,
  transport_notes text,

  -- Visa & Documents
  passport_name text,
  passport_number text,
  visa_required boolean DEFAULT false,
  visa_status text,

  -- Emergency
  emergency_contact_name text,
  emergency_contact_phone text,

  -- Computed
  completion_pct numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Change log
CREATE TABLE public.change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  user_id uuid,
  changes jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 8. Notification queue
CREATE TABLE public.notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_itineraries_arrival_date ON itineraries (arrival_date);
CREATE INDEX idx_itineraries_departure_date ON itineraries (departure_date);
CREATE INDEX idx_itineraries_hotel_preference ON itineraries (hotel_preference);
CREATE INDEX idx_itineraries_event_id ON itineraries (event_id);
CREATE INDEX idx_board_members_event_id ON board_members (event_id);
CREATE INDEX idx_board_members_user_id ON board_members (user_id);
CREATE INDEX idx_access_codes_event_id ON access_codes (event_id);
CREATE INDEX idx_access_codes_code ON access_codes (code);
CREATE INDEX idx_change_log_record_id ON change_log (record_id);
CREATE INDEX idx_change_log_table_name ON change_log (table_name);
CREATE INDEX idx_notification_queue_status ON notification_queue (status);
