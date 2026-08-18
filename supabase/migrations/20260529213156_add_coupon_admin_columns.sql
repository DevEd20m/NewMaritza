ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS used_count  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS color       text    NOT NULL DEFAULT 'var(--cat-lavanda)';;
