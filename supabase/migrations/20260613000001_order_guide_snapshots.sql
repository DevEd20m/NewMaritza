-- Fase 1: Capturar quiz_profile_id en la orden al momento del checkout
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS quiz_profile_id uuid REFERENCES quiz_profiles(id) ON DELETE SET NULL;

-- Fase 2: Snapshot inmutable de guía por orden
CREATE TABLE IF NOT EXISTS order_guide_snapshots (
  id                         uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  order_id                   uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id                    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email                text,
  secure_token               uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  kit_template_id            uuid REFERENCES kits(id) ON DELETE SET NULL,
  quiz_profile_id            uuid REFERENCES quiz_profiles(id) ON DELETE SET NULL,
  guide_snapshot_json        jsonb NOT NULL DEFAULT '{}',
  products_snapshot_json     jsonb NOT NULL DEFAULT '[]',
  safety_flags_snapshot_json jsonb NOT NULL DEFAULT '[]',
  quiz_answers_snapshot_json jsonb NOT NULL DEFAULT '{}',
  guide_version              text NOT NULL DEFAULT '1',
  created_at                 timestamptz NOT NULL DEFAULT now(),
  viewed_at                  timestamptz,
  expires_at                 timestamptz
);

ALTER TABLE order_guide_snapshots
  ADD CONSTRAINT order_guide_snapshots_secure_token_key UNIQUE (secure_token);

CREATE INDEX IF NOT EXISTS ogs_order_id     ON order_guide_snapshots (order_id);
CREATE INDEX IF NOT EXISTS ogs_secure_token ON order_guide_snapshots (secure_token);
CREATE INDEX IF NOT EXISTS ogs_user_id      ON order_guide_snapshots (user_id);

-- RLS: usuarios autenticados solo ven sus propias guías
ALTER TABLE order_guide_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY ogs_owner_read ON order_guide_snapshots
  FOR SELECT
  USING (auth.uid() = user_id);

-- Acceso por secure_token se resuelve en API con service_role (bypass RLS)
