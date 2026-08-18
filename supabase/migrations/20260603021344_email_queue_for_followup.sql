
CREATE TABLE IF NOT EXISTS email_queue (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid REFERENCES orders(id) ON DELETE CASCADE,
  type          text NOT NULL DEFAULT 'day7',
  scheduled_for timestamptz NOT NULL,
  sent          boolean NOT NULL DEFAULT false,
  sent_at       timestamptz,
  error         text,
  created_at    timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_queue_pending ON email_queue (scheduled_for)
  WHERE sent = false;
;
