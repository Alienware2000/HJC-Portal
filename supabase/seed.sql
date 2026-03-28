-- Seed data for local development

-- Default active event for 2026
INSERT INTO events (year, name, is_active)
VALUES (2026, 'Healing Jesus Conference 2026', true)
ON CONFLICT (year) DO NOTHING;

-- Sample access codes for testing
INSERT INTO access_codes (event_id, code, board_member_name)
SELECT
  e.id,
  codes.code,
  codes.member_name
FROM events e,
(VALUES
  ('SMITH-2026', 'John Smith'),
  ('JONES-2026', 'Mary Jones'),
  ('ADAMS-2026', 'David Adams')
) AS codes(code, member_name)
WHERE e.year = 2026
ON CONFLICT (event_id, code) DO NOTHING;
