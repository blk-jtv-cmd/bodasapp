-- Confirmaciones online: enlace general de la boda y enlaces personales por invitado.
-- Los invitados no tienen cuenta: leen y responden solo a través de las dos funciones
-- de abajo (rsvp_get / rsvp_submit), que comprueban el enlace y que la boda esté pagada.

ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS rsvp_token text UNIQUE;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS rsvp_open boolean NOT NULL DEFAULT true;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS rsvp_deadline date;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS rsvp_allow_plus boolean NOT NULL DEFAULT false;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS rsvp_message text NOT NULL DEFAULT '';

ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS rsvp_token text UNIQUE;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS rsvp_at timestamptz;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS rsvp_via text;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS rsvp_comment text NOT NULL DEFAULT '';

-- Nombre normalizado para encontrar a un invitado por su nombre (sin tildes, mayúsculas ni espacios de más).
CREATE OR REPLACE FUNCTION public.rsvp_norm(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT translate(
    lower(regexp_replace(trim(coalesce(t, '')), '\s+', ' ', 'g')),
    'áàäâãéèëêíìïîóòöôõúùüûñç',
    'aaaaaeeeeiiiiooooouuuunc'
  );
$$;

-- Limpia una lista de alergias que llega del formulario.
CREATE OR REPLACE FUNCTION public.rsvp_allergies(j jsonb)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT coalesce(array_agg(DISTINCT left(trim(x), 60)) FILTER (WHERE trim(x) <> ''), '{}')
  FROM (
    SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(j) = 'array' THEN j ELSE '[]'::jsonb END) AS x
    LIMIT 12
  ) s;
$$;

-- Datos que ve el invitado al abrir el enlace.
-- Con el enlace general solo se ve la boda; con un enlace personal, además, su propia respuesta y sus acompañantes.
-- Con el enlace general y un nombre, solo se devuelve cuántos acompañantes tiene previstos (sin nombres ni alergias).
CREATE OR REPLACE FUNCTION public.rsvp_get(p_token text, p_name text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w public.weddings%ROWTYPE;
  g public.guests%ROWTYPE;
  kind text;
  result jsonb;
  matches int;
BEGIN
  IF p_token IS NULL OR length(p_token) < 8 OR length(p_token) > 64 THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  SELECT * INTO w FROM public.weddings WHERE rsvp_token = p_token;
  IF FOUND THEN
    kind := 'general';
  ELSE
    SELECT * INTO g FROM public.guests WHERE rsvp_token = p_token AND companion_of IS NULL;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('status', 'not_found');
    END IF;
    SELECT * INTO w FROM public.weddings WHERE id = g.wedding_id;
    kind := 'personal';
  END IF;

  IF NOT w.plan_active THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  result := jsonb_build_object(
    'status', 'ok',
    'kind', kind,
    'partner_one', w.partner_one,
    'partner_two', w.partner_two,
    'wedding_date', w.wedding_date,
    'ceremony_time', w.ceremony_time,
    'venue', w.venue,
    'deadline', w.rsvp_deadline,
    'open', w.rsvp_open AND (w.rsvp_deadline IS NULL OR w.rsvp_deadline >= current_date),
    'message', w.rsvp_message,
    'allow_plus', w.rsvp_allow_plus
  );

  IF kind = 'personal' THEN
    result := result || jsonb_build_object(
      'guest', jsonb_build_object(
        'name', g.name, 'rsvp', g.rsvp, 'allergies', to_jsonb(g.allergies),
        'comment', g.rsvp_comment, 'responded', g.rsvp_at IS NOT NULL
      ),
      'companions', coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'id', c.id, 'name', c.name, 'rsvp', c.rsvp, 'is_child', c.is_child, 'allergies', to_jsonb(c.allergies)
        ) ORDER BY c.created_at)
        FROM public.guests c WHERE c.companion_of = g.id
      ), '[]'::jsonb)
    );
  ELSIF p_name IS NOT NULL AND rsvp_norm(p_name) <> '' THEN
    SELECT count(*) INTO matches FROM public.guests
    WHERE wedding_id = w.id AND companion_of IS NULL AND rsvp_norm(name) = rsvp_norm(p_name);
    IF matches = 1 THEN
      SELECT * INTO g FROM public.guests
      WHERE wedding_id = w.id AND companion_of IS NULL AND rsvp_norm(name) = rsvp_norm(p_name);
      result := result || jsonb_build_object(
        'slots', (SELECT count(*) FROM public.guests c WHERE c.companion_of = g.id)
      );
    ELSE
      result := result || jsonb_build_object('slots', 0);
    END IF;
  END IF;

  RETURN result;
END;
$$;

-- Guarda la respuesta de un invitado.
-- p_answer: { name, attending, allergies[], comment, companions: [{ id?, name, coming, is_child, allergies[] }] }
CREATE OR REPLACE FUNCTION public.rsvp_submit(p_token text, p_answer jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w public.weddings%ROWTYPE;
  g public.guests%ROWTYPE;
  kind text;
  attending boolean := coalesce((p_answer ->> 'attending')::boolean, false);
  status text;
  guest_name text := left(trim(coalesce(p_answer ->> 'name', '')), 120);
  comment text := left(trim(coalesce(p_answer ->> 'comment', '')), 1000);
  comps jsonb := CASE WHEN jsonb_typeof(p_answer -> 'companions') = 'array' THEN p_answer -> 'companions' ELSE '[]'::jsonb END;
  existing uuid[];
  c jsonb;
  cid uuid;
  cname text;
  ccoming boolean;
  added int := 0;
  matches int;
BEGIN
  IF p_token IS NULL OR length(p_token) < 8 OR length(p_token) > 64 THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  SELECT * INTO w FROM public.weddings WHERE rsvp_token = p_token;
  IF FOUND THEN
    kind := 'general';
  ELSE
    SELECT * INTO g FROM public.guests WHERE rsvp_token = p_token AND companion_of IS NULL;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('status', 'not_found');
    END IF;
    SELECT * INTO w FROM public.weddings WHERE id = g.wedding_id;
    kind := 'personal';
  END IF;

  IF NOT w.plan_active THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  IF NOT w.rsvp_open OR (w.rsvp_deadline IS NOT NULL AND w.rsvp_deadline < current_date) THEN
    RETURN jsonb_build_object('status', 'closed');
  END IF;

  status := CASE WHEN attending THEN 'confirmado' ELSE 'rechazado' END;

  IF kind = 'general' THEN
    IF guest_name = '' THEN
      RETURN jsonb_build_object('status', 'name_required');
    END IF;
    SELECT count(*) INTO matches FROM public.guests
    WHERE wedding_id = w.id AND companion_of IS NULL AND rsvp_norm(name) = rsvp_norm(guest_name);
    IF matches = 1 THEN
      SELECT * INTO g FROM public.guests
      WHERE wedding_id = w.id AND companion_of IS NULL AND rsvp_norm(name) = rsvp_norm(guest_name);
    ELSE
      -- Freno contra abusos: como mucho 300 personas nuevas por el enlace general.
      IF (SELECT count(*) FROM public.guests WHERE wedding_id = w.id AND rsvp_via = 'nuevo') >= 300 THEN
        RETURN jsonb_build_object('status', 'closed');
      END IF;
      INSERT INTO public.guests (wedding_id, user_id, name, guest_group, invited_by, rsvp, notes, rsvp_via)
      VALUES (w.id, w.user_id, guest_name, 'Otros', '', 'pendiente', '', 'nuevo')
      RETURNING * INTO g;
    END IF;
  END IF;

  UPDATE public.guests SET
    rsvp = status,
    allergies = CASE WHEN attending THEN rsvp_allergies(p_answer -> 'allergies') ELSE allergies END,
    rsvp_comment = comment,
    rsvp_at = now(),
    rsvp_via = CASE WHEN rsvp_via = 'nuevo' THEN 'nuevo' ELSE kind END
  WHERE id = g.id;

  -- Acompañantes ya previstos por la pareja, en orden.
  SELECT coalesce(array_agg(id ORDER BY created_at), '{}') INTO existing
  FROM public.guests WHERE companion_of = g.id;

  FOR c IN SELECT * FROM jsonb_array_elements(comps) LIMIT 10 LOOP
    cname := left(trim(coalesce(c ->> 'name', '')), 120);
    ccoming := attending AND coalesce((c ->> 'coming')::boolean, true);
    cid := NULL;
    IF kind = 'personal' AND (c ->> 'id') IS NOT NULL THEN
      -- Solo se aceptan ids que de verdad son acompañantes de este invitado.
      SELECT id INTO cid FROM public.guests WHERE id = (c ->> 'id')::uuid AND companion_of = g.id;
    ELSIF kind = 'general' THEN
      -- Con el enlace general se van ocupando, en orden, los acompañantes que la pareja ya tenía previstos.
      cid := existing[1];
    END IF;

    IF cid IS NOT NULL THEN
      UPDATE public.guests SET
        name = CASE WHEN cname <> '' THEN cname ELSE name END,
        rsvp = CASE WHEN ccoming THEN 'confirmado' ELSE 'rechazado' END,
        is_child = coalesce((c ->> 'is_child')::boolean, is_child),
        allergies = CASE WHEN ccoming THEN rsvp_allergies(c -> 'allergies') ELSE allergies END,
        rsvp_at = now(),
        rsvp_via = kind
      WHERE id = cid;
      existing := array_remove(existing, cid);
    ELSIF ccoming AND cname <> '' AND w.rsvp_allow_plus AND added < 5 THEN
      INSERT INTO public.guests (wedding_id, user_id, name, guest_group, invited_by, rsvp, notes,
                                 companion_of, is_child, allergies, rsvp_at, rsvp_via)
      VALUES (w.id, w.user_id, cname, 'Acompañante', g.invited_by, 'confirmado', '',
              g.id, coalesce((c ->> 'is_child')::boolean, false), rsvp_allergies(c -> 'allergies'), now(), 'nuevo');
      added := added + 1;
    END IF;
  END LOOP;

  -- Acompañantes previstos de los que no han dicho nada: si el invitado no viene, tampoco ellos.
  IF NOT attending THEN
    UPDATE public.guests SET rsvp = 'rechazado', rsvp_at = now(), rsvp_via = kind
    WHERE companion_of = g.id;
  END IF;

  RETURN jsonb_build_object('status', 'ok', 'attending', attending);
END;
$$;

REVOKE ALL ON FUNCTION public.rsvp_get(text, text) FROM public;
REVOKE ALL ON FUNCTION public.rsvp_submit(text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.rsvp_get(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rsvp_submit(text, jsonb) TO anon, authenticated;
