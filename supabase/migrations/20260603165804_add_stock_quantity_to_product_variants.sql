ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT NULL;

COMMENT ON COLUMN public.product_variants.stock_quantity IS 'NULL = infinite stock (not tracked). Any integer = tracked stock, decremented on purchase.';;
