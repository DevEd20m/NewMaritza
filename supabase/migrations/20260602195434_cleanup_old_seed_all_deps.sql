
-- Obtener variantes de los productos sin imagen en variable temporal
DO $$
DECLARE
  old_variant_ids uuid[];
  old_kit_ids uuid[];
  old_template_ids uuid[];
BEGIN
  -- IDs de variantes de los 12 productos placeholder
  SELECT ARRAY(SELECT id FROM product_variants WHERE product_id::text LIKE '22220%')
  INTO old_variant_ids;

  -- IDs de kits viejos (44440001-*)
  SELECT ARRAY(SELECT id FROM kits WHERE id::text LIKE '44440001%')
  INTO old_kit_ids;

  -- IDs de quiz_templates de los kits viejos
  SELECT ARRAY(SELECT id FROM quiz_templates WHERE kit_id::text LIKE '44440001%')
  INTO old_template_ids;

  -- Limpiar quiz en cascada
  DELETE FROM quiz_question_options
    WHERE question_id IN (
      SELECT qq.id FROM quiz_questions qq
      JOIN quiz_question_groups qg ON qg.id = qq.group_id
      WHERE qg.template_id = ANY(old_template_ids)
    );
  DELETE FROM quiz_questions
    WHERE group_id IN (SELECT id FROM quiz_question_groups WHERE template_id = ANY(old_template_ids));
  DELETE FROM quiz_question_groups WHERE template_id = ANY(old_template_ids);
  DELETE FROM quiz_profiles WHERE template_id = ANY(old_template_ids);
  DELETE FROM quiz_templates WHERE id = ANY(old_template_ids);

  -- Limpiar dependencias de variantes viejas
  DELETE FROM recommendations WHERE variant_id = ANY(old_variant_ids);
  DELETE FROM cart_items     WHERE variant_id = ANY(old_variant_ids);
  DELETE FROM order_items    WHERE variant_id = ANY(old_variant_ids);
  -- Coupons: poner NULL en gift_variant_id si apunta a variantes viejas
  UPDATE coupons SET gift_variant_id = NULL WHERE gift_variant_id = ANY(old_variant_ids);

  -- Pedidos huérfanos (sin items)
  DELETE FROM orders WHERE id NOT IN (SELECT DISTINCT order_id FROM order_items);

  -- Limpiar kits viejos
  DELETE FROM kit_products WHERE kit_id = ANY(old_kit_ids);
  DELETE FROM kits         WHERE id     = ANY(old_kit_ids);

  -- Limpiar productos viejos
  DELETE FROM product_prices   WHERE variant_id  = ANY(old_variant_ids);
  DELETE FROM product_variants WHERE id          = ANY(old_variant_ids);
  DELETE FROM products         WHERE id::text LIKE '22220%';
END $$;
;
