-- Pago con Stripe: guardamos cuándo y con qué sesión se pagó el plan,
-- y protegemos las secciones de pago en la base de datos.

ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS stripe_session_id text;

-- ¿Ha pagado la boda indicada (y pertenece al usuario que pregunta)?
CREATE OR REPLACE FUNCTION public.wedding_is_paid(wid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.weddings
    WHERE id = wid AND user_id = auth.uid() AND plan_active
  );
$$;
REVOKE EXECUTE ON FUNCTION public.wedding_is_paid(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wedding_is_paid(uuid) TO authenticated;

-- Secciones de pago: presupuesto (gastos), invitados, proveedores, cronograma y mesas.
DROP POLICY IF EXISTS "own expenses" ON public.expenses;
CREATE POLICY "own expenses" ON public.expenses FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.wedding_is_paid(wedding_id))
  WITH CHECK (auth.uid() = user_id AND public.wedding_is_paid(wedding_id));

DROP POLICY IF EXISTS "own guests" ON public.guests;
CREATE POLICY "own guests" ON public.guests FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.wedding_is_paid(wedding_id))
  WITH CHECK (auth.uid() = user_id AND public.wedding_is_paid(wedding_id));

DROP POLICY IF EXISTS "own vendors" ON public.vendors;
CREATE POLICY "own vendors" ON public.vendors FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.wedding_is_paid(wedding_id))
  WITH CHECK (auth.uid() = user_id AND public.wedding_is_paid(wedding_id));

DROP POLICY IF EXISTS "own timeline" ON public.timeline_items;
CREATE POLICY "own timeline" ON public.timeline_items FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.wedding_is_paid(wedding_id))
  WITH CHECK (auth.uid() = user_id AND public.wedding_is_paid(wedding_id));

DROP POLICY IF EXISTS "select_own_tables" ON public.wedding_tables;
DROP POLICY IF EXISTS "insert_own_tables" ON public.wedding_tables;
DROP POLICY IF EXISTS "update_own_tables" ON public.wedding_tables;
DROP POLICY IF EXISTS "delete_own_tables" ON public.wedding_tables;
CREATE POLICY "own tables" ON public.wedding_tables FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.wedding_is_paid(wedding_id))
  WITH CHECK (auth.uid() = user_id AND public.wedding_is_paid(wedding_id));
