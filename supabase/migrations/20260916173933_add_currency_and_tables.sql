/*
# Add currency to weddings and create wedding_tables for Mesas

1. Modified Tables
- `weddings`: add `currency` text column, default 'EUR', NOT NULL.
  Stores the ISO 4217 currency code the couple wants to use across the app.

2. New Tables
- `wedding_tables`:
  - `id` (uuid, primary key)
  - `wedding_id` (uuid, FK to weddings, cascade delete)
  - `user_id` (uuid, FK to auth.users, cascade delete)
  - `name` (text, not null — e.g. "Mesa 1", "Mesa de honor")
  - `capacity` (integer, not null, default 8 — number of seats at this table)
  - `shape` (text, not null, default 'round' — 'round' | 'rect')
  - `pos_x` (numeric, default 0 — X position in the salon canvas)
  - `pos_y` (numeric, default 0 — Y position in the salon canvas)
  - `sort_order` (integer, default 0)
  - `created_at` (timestamptz, default now())

3. Modified Tables (guests)
- `guests.table_number` already exists as text. We will repurpose it to store
  the wedding_tables.id (as text) so we know which table a guest is seated at.
  No schema change needed — just a usage convention.

4. Security
- Enable RLS on `wedding_tables`.
- Owner-scoped CRUD: each authenticated user can only access rows they own.
*/

ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR';

CREATE TABLE IF NOT EXISTS public.wedding_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Mesa',
  capacity integer NOT NULL DEFAULT 8,
  shape text NOT NULL DEFAULT 'round',
  pos_x numeric NOT NULL DEFAULT 0,
  pos_y numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wedding_tables TO authenticated;
GRANT ALL ON public.wedding_tables TO service_role;

ALTER TABLE public.wedding_tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tables" ON public.wedding_tables;
CREATE POLICY "select_own_tables" ON public.wedding_tables
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tables" ON public.wedding_tables;
CREATE POLICY "insert_own_tables" ON public.wedding_tables
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tables" ON public.wedding_tables;
CREATE POLICY "update_own_tables" ON public.wedding_tables
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tables" ON public.wedding_tables;
CREATE POLICY "delete_own_tables" ON public.wedding_tables
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
