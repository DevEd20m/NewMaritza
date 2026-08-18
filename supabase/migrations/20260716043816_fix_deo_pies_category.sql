UPDATE public.products
SET category_id = (SELECT id FROM public.categories WHERE slug = 'pies-cuerpo')
WHERE id = '58330351-6ae5-49c2-811d-42249cd3390f';;
