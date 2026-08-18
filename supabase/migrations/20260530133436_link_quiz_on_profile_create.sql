
-- Trigger: when a new profile is created, look up leads by email and copy quiz_profile_id
CREATE OR REPLACE FUNCTION public.link_quiz_on_profile_create()
RETURNS TRIGGER AS $$
DECLARE
  v_email text;
  v_quiz_profile_id uuid;
BEGIN
  -- profiles.id = auth.users.id
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;

  IF v_email IS NOT NULL AND NEW.quiz_profile_id IS NULL THEN
    SELECT quiz_profile_id INTO v_quiz_profile_id
    FROM public.leads
    WHERE email = v_email
      AND quiz_profile_id IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_quiz_profile_id IS NOT NULL THEN
      NEW.quiz_profile_id := v_quiz_profile_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_link_quiz
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.link_quiz_on_profile_create();
;
