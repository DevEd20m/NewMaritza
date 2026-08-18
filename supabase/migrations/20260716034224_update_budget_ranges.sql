UPDATE public.quiz_question_options
SET text = 'Hasta S/200 — lo esencial'
WHERE slug = 'presupuesto-bajo'
  AND question_id = '55550012-0003-0004-0000-000000000001';

UPDATE public.quiz_question_options
SET text = 'S/200 – S/400'
WHERE slug = 'presupuesto-medio'
  AND question_id = '55550012-0003-0004-0000-000000000001';

UPDATE public.quiz_question_options
SET text = 'S/400 – S/600'
WHERE slug = 'presupuesto-alto'
  AND question_id = '55550012-0003-0004-0000-000000000001';

UPDATE public.quiz_question_options
SET text = 'Más de S/600 — quiero lo mejor'
WHERE slug = 'presupuesto-premium'
  AND question_id = '55550012-0003-0004-0000-000000000001';;
