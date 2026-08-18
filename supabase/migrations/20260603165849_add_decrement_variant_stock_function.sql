CREATE OR REPLACE FUNCTION public.decrement_variant_stock(p_variant_id uuid, p_qty integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.product_variants
  SET stock_quantity = GREATEST(0, stock_quantity - p_qty)
  WHERE id = p_variant_id
    AND stock_quantity IS NOT NULL;
END;
$$;;
