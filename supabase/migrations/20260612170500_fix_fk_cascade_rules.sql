
-- 1. cart_items: si se borra la variante, limpiar el carrito
ALTER TABLE cart_items DROP CONSTRAINT cart_items_variant_id_fkey;
ALTER TABLE cart_items ADD CONSTRAINT cart_items_variant_id_fkey
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;

-- 2. coupons: si se borra la variante del regalo, nullear
ALTER TABLE coupons DROP CONSTRAINT coupons_gift_variant_id_fkey;
ALTER TABLE coupons ADD CONSTRAINT coupons_gift_variant_id_fkey
  FOREIGN KEY (gift_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;

-- 3. products: si se borra la categoría, los productos quedan sin categoría
ALTER TABLE products DROP CONSTRAINT products_category_id_fkey;
ALTER TABLE products ADD CONSTRAINT products_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- 4. quiz_templates: si se borra el kit, el template también se borra
ALTER TABLE quiz_templates DROP CONSTRAINT quiz_templates_kit_id_fkey;
ALTER TABLE quiz_templates ADD CONSTRAINT quiz_templates_kit_id_fkey
  FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE;

-- 5. recommendations: si se borra la variante, limpiar recomendaciones huérfanas
ALTER TABLE recommendations DROP CONSTRAINT recommendations_variant_id_fkey;
ALTER TABLE recommendations ADD CONSTRAINT recommendations_variant_id_fkey
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;
;
