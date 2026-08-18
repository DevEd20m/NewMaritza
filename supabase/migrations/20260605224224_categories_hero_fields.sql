
ALTER TABLE public.categories
  ADD COLUMN show_in_hero boolean NOT NULL DEFAULT false,
  ADD COLUMN hero_sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN hero_tagline text,
  ADD COLUMN color text NOT NULL DEFAULT 'var(--cat-lavanda)';

UPDATE public.categories SET show_in_hero = true, hero_sort_order = 1, color = 'var(--cat-menta)',    hero_tagline = 'Superalimentos y plantas peruanas'        WHERE slug = 'organicos';
UPDATE public.categories SET show_in_hero = true, hero_sort_order = 2, color = 'var(--cat-durazno)',  hero_tagline = 'Energía, fuerza y recuperación'           WHERE slug = 'gym';
UPDATE public.categories SET show_in_hero = true, hero_sort_order = 3, color = 'var(--cat-coral)',    hero_tagline = 'Rutinas para cuidar tu piel cada día'     WHERE slug = 'skin-care';
UPDATE public.categories SET show_in_hero = true, hero_sort_order = 4, color = 'var(--cat-mostaza)', hero_tagline = 'Nutrición diaria para tu cuerpo y mente'  WHERE slug = 'vitaminas';
;
