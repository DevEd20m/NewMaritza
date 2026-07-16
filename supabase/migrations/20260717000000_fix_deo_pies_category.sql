-- El Desodorante Spray Deo Pies Clinical estaba en "Piel y barrera", por lo que
-- el recomendador lo ofrecía como producto de skincare. Va a "Pies y cuerpo",
-- donde ya están los demás desodorantes/talcos para pies.

UPDATE public.products
SET category_id = (SELECT id FROM public.categories WHERE slug = 'pies-cuerpo')
WHERE id = '58330351-6ae5-49c2-811d-42249cd3390f';
