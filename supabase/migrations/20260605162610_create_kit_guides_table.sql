
CREATE TABLE public.kit_guides (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  slug text NOT NULL UNIQUE,
  kit_name text NOT NULL,
  tagline text NOT NULL,
  description text NOT NULL,
  color text NOT NULL DEFAULT 'var(--cat-lavanda)',
  matching_keywords text[] NOT NULL DEFAULT '{}',
  schedule jsonb NOT NULL DEFAULT '[]',
  timeline jsonb NOT NULL DEFAULT '[]',
  tips jsonb NOT NULL DEFAULT '[]',
  faqs jsonb NOT NULL DEFAULT '[]',
  recipe jsonb,
  warnings text[],
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kit_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kit_guides public read" ON public.kit_guides FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.update_kit_guides_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER kit_guides_updated_at
  BEFORE UPDATE ON public.kit_guides
  FOR EACH ROW EXECUTE FUNCTION public.update_kit_guides_updated_at();
;
