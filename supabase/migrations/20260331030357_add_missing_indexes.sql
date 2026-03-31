-- Add index on profiles.role for team member filtering
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);

-- Add index on change_log.created_at for activity feed ordering
CREATE INDEX IF NOT EXISTS idx_change_log_created_at ON change_log (created_at DESC);
