-- Seed: base categories for the electronics store
-- Run once against your Supabase project:
--   supabase db reset  (will run this automatically)
-- or paste directly in the Supabase SQL editor.

insert into categories (name, slug) values
  ('Cables',       'cables'),
  ('Components',   'components'),
  ('Accessories',  'accessories')
on conflict (slug) do nothing;
