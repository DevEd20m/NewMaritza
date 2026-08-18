
ALTER TABLE public.kits
  ADD COLUMN show_in_home boolean NOT NULL DEFAULT false,
  ADD COLUMN home_sort_order integer NOT NULL DEFAULT 0;

-- Set the 4 most popular kits visible in home by default
UPDATE public.kits SET show_in_home = true, home_sort_order = 1 WHERE slug = 'kit-colageno-radiante';
UPDATE public.kits SET show_in_home = true, home_sort_order = 2 WHERE slug = 'kit-gym-performance';
UPDATE public.kits SET show_in_home = true, home_sort_order = 3 WHERE slug = 'kit-vitaminas-esenciales';
UPDATE public.kits SET show_in_home = true, home_sort_order = 4 WHERE slug = 'kit-sueno-profundo';
;
