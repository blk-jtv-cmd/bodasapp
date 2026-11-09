-- Refuerzos de seguridad (auditoría del 9/11/2026).

-- 1) Tareas y categorías de gasto: además de ser el autor, la boda tiene que ser tuya.
CREATE OR REPLACE FUNCTION public.owns_wedding(wid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.weddings WHERE id = wid AND user_id = auth.uid());
$$;
REVOKE EXECUTE ON FUNCTION public.owns_wedding(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_wedding(uuid) TO authenticated;

DROP POLICY IF EXISTS "own tasks" ON public.tasks;
CREATE POLICY "own tasks" ON public.tasks FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.owns_wedding(wedding_id));

DROP POLICY IF EXISTS "own expense categories" ON public.expense_categories;
CREATE POLICY "own expense categories" ON public.expense_categories FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.owns_wedding(wedding_id));

-- 2) Un acompañante solo puede ir con un invitado de su misma boda.
CREATE OR REPLACE FUNCTION public.check_companion_same_wedding()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.companion_of IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.guests WHERE id = NEW.companion_of AND wedding_id = NEW.wedding_id
  ) THEN
    RAISE EXCEPTION 'companion_of must belong to the same wedding';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS check_companion_same_wedding ON public.guests;
CREATE TRIGGER check_companion_same_wedding
BEFORE INSERT OR UPDATE OF companion_of, wedding_id ON public.guests
FOR EACH ROW EXECUTE FUNCTION public.check_companion_same_wedding();

-- 3) Un código de enlace no puede repetirse entre bodas e invitados.
CREATE OR REPLACE FUNCTION public.check_rsvp_token_unique()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.rsvp_token IS NOT NULL AND (
    (TG_TABLE_NAME = 'weddings' AND EXISTS (SELECT 1 FROM public.guests WHERE rsvp_token = NEW.rsvp_token))
    OR (TG_TABLE_NAME = 'guests' AND EXISTS (SELECT 1 FROM public.weddings WHERE rsvp_token = NEW.rsvp_token))
  ) THEN
    RAISE EXCEPTION 'duplicate rsvp_token' USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS check_rsvp_token_unique ON public.weddings;
CREATE TRIGGER check_rsvp_token_unique BEFORE INSERT OR UPDATE OF rsvp_token ON public.weddings
FOR EACH ROW EXECUTE FUNCTION public.check_rsvp_token_unique();
DROP TRIGGER IF EXISTS check_rsvp_token_unique ON public.guests;
CREATE TRIGGER check_rsvp_token_unique BEFORE INSERT OR UPDATE OF rsvp_token ON public.guests
FOR EACH ROW EXECUTE FUNCTION public.check_rsvp_token_unique();

-- 4) Sugerencias: como mucho 5 por persona cada 24 horas.
CREATE OR REPLACE FUNCTION public.limit_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT count(*) FROM public.feedback
      WHERE user_id = NEW.user_id AND created_at > now() - interval '24 hours') >= 5 THEN
    RAISE EXCEPTION 'too many feedback messages' USING ERRCODE = '54000';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS limit_feedback ON public.feedback;
CREATE TRIGGER limit_feedback BEFORE INSERT ON public.feedback
FOR EACH ROW EXECUTE FUNCTION public.limit_feedback();

-- Comprobación: debe salir una sola regla por tabla (si sale alguna más, avisad).
SELECT tablename, policyname, cmd FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('tasks', 'expense_categories')
ORDER BY tablename, policyname;
