-- Helper function to get current user's role from JWT
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(auth.jwt() ->> 'user_role', '');
$$;

-- Events: anyone can read, admin can write
CREATE POLICY "events_select_all" ON events FOR SELECT USING (true);
CREATE POLICY "events_admin_all" ON events FOR ALL USING (public.current_user_role() = 'admin');

-- Profiles: own profile or admin
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT USING (public.current_user_role() = 'admin');
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (public.current_user_role() = 'admin');

-- Access codes: authenticated can read, admin can write
CREATE POLICY "access_codes_select_authed" ON access_codes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "access_codes_admin_all" ON access_codes FOR ALL USING (public.current_user_role() = 'admin');

-- Board members: own, admin all, staff read
CREATE POLICY "board_members_select_own" ON board_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "board_members_update_own" ON board_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "board_members_admin_all" ON board_members FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY "board_members_staff_select" ON board_members FOR SELECT USING (public.current_user_role() = 'staff');

-- Party members: own board member's party, admin all, staff read
CREATE POLICY "party_members_select_own" ON party_members FOR SELECT USING (
  board_member_id IN (SELECT id FROM board_members WHERE user_id = auth.uid())
);
CREATE POLICY "party_members_insert_own" ON party_members FOR INSERT WITH CHECK (
  board_member_id IN (SELECT id FROM board_members WHERE user_id = auth.uid())
);
CREATE POLICY "party_members_update_own" ON party_members FOR UPDATE USING (
  board_member_id IN (SELECT id FROM board_members WHERE user_id = auth.uid())
);
CREATE POLICY "party_members_delete_own" ON party_members FOR DELETE USING (
  board_member_id IN (SELECT id FROM board_members WHERE user_id = auth.uid())
);
CREATE POLICY "party_members_admin_all" ON party_members FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY "party_members_staff_select" ON party_members FOR SELECT USING (public.current_user_role() = 'staff');

-- Itineraries: own board member's, admin all, staff read
CREATE POLICY "itineraries_select_own" ON itineraries FOR SELECT USING (
  board_member_id IN (SELECT id FROM board_members WHERE user_id = auth.uid())
);
CREATE POLICY "itineraries_update_own" ON itineraries FOR UPDATE USING (
  board_member_id IN (SELECT id FROM board_members WHERE user_id = auth.uid())
);
CREATE POLICY "itineraries_insert_own" ON itineraries FOR INSERT WITH CHECK (
  board_member_id IN (SELECT id FROM board_members WHERE user_id = auth.uid())
);
CREATE POLICY "itineraries_admin_all" ON itineraries FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY "itineraries_staff_select" ON itineraries FOR SELECT USING (public.current_user_role() = 'staff');

-- Change log: admin and staff can read
CREATE POLICY "change_log_select_admin" ON change_log FOR SELECT USING (public.current_user_role() = 'admin');
CREATE POLICY "change_log_select_staff" ON change_log FOR SELECT USING (public.current_user_role() = 'staff');
CREATE POLICY "change_log_insert_any" ON change_log FOR INSERT WITH CHECK (true);

-- Notification queue: admin only
CREATE POLICY "notification_queue_admin_all" ON notification_queue FOR ALL USING (public.current_user_role() = 'admin');
