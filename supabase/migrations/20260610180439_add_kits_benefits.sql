alter table kits add column if not exists benefits jsonb not null default '[]'::jsonb;;
