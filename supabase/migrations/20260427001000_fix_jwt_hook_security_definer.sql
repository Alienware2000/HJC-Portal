-- Fix: custom_access_token_hook was missing SECURITY DEFINER, so RLS on
-- public.profiles blocked the role lookup when GoTrue called the hook
-- (the hook runs as supabase_auth_admin, which has SELECT grant but is
-- subject to RLS policies that filter all rows for non-authenticated callers).
-- Result: every JWT got user_role='board_member' (the fallback), even for admins.
--
-- Fix: run the function as its owner (postgres) to bypass RLS. Also
-- explicitly set search_path to prevent search-path-based escalation.

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_id_text text;
  user_role text;
BEGIN
  claims := event -> 'claims';
  -- Be defensive: take user_id from event, or claims.sub if absent.
  user_id_text := coalesce(event ->> 'user_id', claims ->> 'sub');

  IF user_id_text IS NOT NULL THEN
    SELECT role INTO user_role FROM public.profiles WHERE id = user_id_text::uuid;
  END IF;

  IF user_role IS NULL THEN
    user_role := 'board_member';
  END IF;

  claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- Make sure auth admin can still call the function.
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
