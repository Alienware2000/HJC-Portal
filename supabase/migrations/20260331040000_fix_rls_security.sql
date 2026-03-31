-- Fix #1: Restrict access_codes SELECT to admin/staff + own code only.
-- Previously any authenticated user could read ALL access codes (credential disclosure).
DROP POLICY IF EXISTS "access_codes_select_authed" ON access_codes;

CREATE POLICY "access_codes_select_admin_staff" ON access_codes
  FOR SELECT USING (public.current_user_role() IN ('admin', 'staff'));

CREATE POLICY "access_codes_select_own" ON access_codes
  FOR SELECT USING (
    board_member_id IN (SELECT id FROM board_members WHERE user_id = auth.uid())
  );

-- Fix #2: Remove overly permissive change_log INSERT policy.
-- The log_itinerary_changes() trigger uses SECURITY DEFINER and bypasses RLS.
-- The service-role client also bypasses RLS. No client-facing INSERT policy is needed.
DROP POLICY IF EXISTS "change_log_insert_any" ON change_log;
