-- Add directory fields to board_members for the real HJC roster.
-- The existing `email` column stores the synthetic auth email
-- (e.g. smith-2026@conference.internal); `contact_emails` holds
-- the member's real contact addresses (array — many members have
-- multiple, e.g. personal + office + assistant).

ALTER TABLE public.board_members
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS ministry text,
  ADD COLUMN IF NOT EXISTS year_joined integer,
  ADD COLUMN IF NOT EXISTS contact_emails text[];

CREATE INDEX IF NOT EXISTS idx_board_members_country
  ON public.board_members (country);

CREATE INDEX IF NOT EXISTS idx_board_members_event_country
  ON public.board_members (event_id, country);
