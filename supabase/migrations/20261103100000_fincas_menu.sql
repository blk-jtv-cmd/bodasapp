-- Fincas (comparador de lugares) y Menú y catering. Secciones del plan de pago.

CREATE TABLE IF NOT EXISTS public.venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  rating integer NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  location text NOT NULL DEFAULT '',
  contact text NOT NULL DEFAULT '',
  link text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  capacity integer NOT NULL DEFAULT 0,
  available text NOT NULL DEFAULT 'Por confirmar',
  includes_catering boolean NOT NULL DEFAULT false,
  outdoor_ceremony boolean NOT NULL DEFAULT false,
  guest_lodging boolean NOT NULL DEFAULT false,
  parking boolean NOT NULL DEFAULT false,
  pros text NOT NULL DEFAULT '',
  cons text NOT NULL DEFAULT '',
  decision text NOT NULL DEFAULT 'Pendiente',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  moment text NOT NULL DEFAULT 'Principal',
  dish text NOT NULL DEFAULT '',
  restriction text NOT NULL DEFAULT 'Estándar',
  vendor text NOT NULL DEFAULT '',
  price_per_person numeric NOT NULL DEFAULT 0,
  people integer NOT NULL DEFAULT 0,
  covers_restrictions boolean NOT NULL DEFAULT false,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venues, public.menu_items TO authenticated;
GRANT ALL ON public.venues, public.menu_items TO service_role;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own venues" ON public.venues;
CREATE POLICY "own venues" ON public.venues FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.wedding_is_paid(wedding_id))
  WITH CHECK (auth.uid() = user_id AND public.wedding_is_paid(wedding_id));

DROP POLICY IF EXISTS "own menu" ON public.menu_items;
CREATE POLICY "own menu" ON public.menu_items FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.wedding_is_paid(wedding_id))
  WITH CHECK (auth.uid() = user_id AND public.wedding_is_paid(wedding_id));
