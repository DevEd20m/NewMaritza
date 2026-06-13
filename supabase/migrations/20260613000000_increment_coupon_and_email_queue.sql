-- Función para incrementar used_count de cupones tras pago exitoso
CREATE OR REPLACE FUNCTION public.increment_coupon_used_count(p_coupon_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.coupons
  SET used_count = COALESCE(used_count, 0) + 1
  WHERE id = p_coupon_id;
END;
$$;

-- Cola de emails programados (Day 7, etc.)
CREATE TABLE IF NOT EXISTS public.email_queue (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  type text NOT NULL,
  scheduled_for timestamp with time zone NOT NULL,
  sent boolean NOT NULL DEFAULT false,
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT email_queue_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS email_queue_scheduled_unsent
  ON public.email_queue (scheduled_for)
  WHERE sent = false;
