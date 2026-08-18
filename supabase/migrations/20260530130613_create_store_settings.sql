CREATE TABLE IF NOT EXISTS store_settings (
  key   text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO store_settings (key, value) VALUES
  ('free_shipping_threshold_cents', '15000'),
  ('shipping_cost_cents',           '1500'),
  ('delivery_hours_label',          '36–48h'),
  ('delivery_city',                 'Lima')
ON CONFLICT (key) DO NOTHING;;
