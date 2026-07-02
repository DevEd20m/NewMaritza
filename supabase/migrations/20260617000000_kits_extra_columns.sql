ALTER TABLE public.kits
  ADD COLUMN IF NOT EXISTS show_in_home boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS home_sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS benefits jsonb NOT NULL DEFAULT '[]'::jsonb;
