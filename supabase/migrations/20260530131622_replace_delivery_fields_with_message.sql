
-- Replace delivery_hours_label + delivery_city with a single delivery_message field
DELETE FROM store_settings WHERE key IN ('delivery_hours_label', 'delivery_city');

INSERT INTO store_settings (key, value)
VALUES ('delivery_message', 'Lima 36–48h · Provincias 3–5 días')
ON CONFLICT (key) DO NOTHING;
;
