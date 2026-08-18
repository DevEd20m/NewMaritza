
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'everyone',
  ADD COLUMN IF NOT EXISTS placements text[] NOT NULL DEFAULT ARRAY['exit_modal'],
  ADD COLUMN IF NOT EXISTS promo_title text,
  ADD COLUMN IF NOT EXISTS promo_subtitle text,
  ADD COLUMN IF NOT EXISTS promo_cta text;

ALTER TABLE public.coupons
  ADD CONSTRAINT coupons_audience_check
  CHECK (audience = ANY (ARRAY['everyone'::text, 'logged_out'::text, 'logged_in'::text, 'returning'::text]));
;
