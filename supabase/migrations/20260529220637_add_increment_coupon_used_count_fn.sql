CREATE OR REPLACE FUNCTION increment_coupon_used_count(p_coupon_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE coupons SET used_count = used_count + 1 WHERE id = p_coupon_id;
$$;;
