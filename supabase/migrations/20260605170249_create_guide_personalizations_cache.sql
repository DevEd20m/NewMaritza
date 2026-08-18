
CREATE TABLE public.guide_personalizations (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  quiz_profile_id uuid NOT NULL,
  guide_slug text NOT NULL,
  intro_text text NOT NULL,
  highlighted_tip_index integer,
  active_warnings text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(quiz_profile_id, guide_slug)
);

ALTER TABLE public.guide_personalizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guide_personalizations public read" ON public.guide_personalizations FOR SELECT USING (true);
;
