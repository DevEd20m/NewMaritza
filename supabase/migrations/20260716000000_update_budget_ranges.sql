-- Recalibrar rangos de presupuesto del cuestionario a los precios reales del catálogo.
-- Las rutinas curadas van de S/73 a S/775 (mediana ~S/400) y el producto mediano
-- cuesta S/85; los rangos anteriores (hasta S/80, S/80-150...) no alcanzaban ni
-- para 1-2 productos. Los slugs no cambian: solo el texto visible.

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
  AND question_id = '55550012-0003-0004-0000-000000000001';
