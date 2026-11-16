-- Regalar el plan: tarjetas regalo con un código de un solo uso, válidas 12 meses.
-- Nadie lee esta tabla directamente: solo a través de las funciones de abajo y del webhook de Stripe.
CREATE TABLE IF NOT EXISTS public.gift_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  stripe_session_id text UNIQUE,
  stripe_payment_intent text,
  buyer_email text,
  from_name text NOT NULL DEFAULT '',
  to_name text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  amount integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  redeemed_at timestamptz,
  redeemed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  voided_at timestamptz
);
CREATE INDEX IF NOT EXISTS gift_codes_payment_intent_idx ON public.gift_codes (stripe_payment_intent);
ALTER TABLE public.gift_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gift_codes FROM anon, authenticated;
GRANT ALL ON public.gift_codes TO service_role;

-- "bodA-7k3m q9xz…" → "BODA-7K3M-Q9XZ-…" (sin espacios ni guiones de más).
CREATE OR REPLACE FUNCTION public.gift_norm(p text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT upper(regexp_replace(coalesce(p, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

-- Lo que ve quien abre el enlace del regalo (sin datos del comprador).
CREATE OR REPLACE FUNCTION public.gift_preview(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  g public.gift_codes%ROWTYPE;
BEGIN
  IF length(public.gift_norm(p_code)) < 10 THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  SELECT * INTO g FROM public.gift_codes WHERE public.gift_norm(code) = public.gift_norm(p_code);
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  RETURN jsonb_build_object(
    'status', CASE
      WHEN g.voided_at IS NOT NULL THEN 'void'
      WHEN g.redeemed_at IS NOT NULL THEN 'redeemed'
      WHEN g.expires_at < now() THEN 'expired'
      ELSE 'valid' END,
    'code', g.code,
    'from_name', g.from_name,
    'to_name', g.to_name,
    'message', g.message,
    'expires_at', g.expires_at
  );
END;
$$;

-- Para la página de "regalo listo": quien acaba de pagar tiene el id de la sesión de Stripe (secreto y largo).
CREATE OR REPLACE FUNCTION public.gift_by_session(p_session text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  g public.gift_codes%ROWTYPE;
BEGIN
  IF p_session IS NULL OR length(p_session) < 20 THEN
    RETURN NULL;
  END IF;
  SELECT * INTO g FROM public.gift_codes WHERE stripe_session_id = p_session;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  RETURN jsonb_build_object(
    'code', g.code, 'from_name', g.from_name, 'to_name', g.to_name,
    'message', g.message, 'expires_at', g.expires_at
  );
END;
$$;

-- Canjear: activa el plan de la boda de quien canjea. Un solo uso.
CREATE OR REPLACE FUNCTION public.redeem_gift(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  g public.gift_codes%ROWTYPE;
  w public.weddings%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('status', 'unauthorized');
  END IF;
  SELECT * INTO g FROM public.gift_codes WHERE public.gift_norm(code) = public.gift_norm(p_code) FOR UPDATE;
  IF NOT FOUND OR length(public.gift_norm(p_code)) < 10 THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  IF g.voided_at IS NOT NULL THEN RETURN jsonb_build_object('status', 'void'); END IF;
  IF g.redeemed_at IS NOT NULL THEN
    RETURN jsonb_build_object('status', CASE WHEN g.redeemed_by = auth.uid() THEN 'already_yours' ELSE 'redeemed' END);
  END IF;
  IF g.expires_at < now() THEN RETURN jsonb_build_object('status', 'expired'); END IF;

  SELECT * INTO w FROM public.weddings WHERE user_id = auth.uid() ORDER BY created_at LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'no_wedding'); END IF;
  -- Si la cuenta ya tenía el plan, el código no se gasta (se puede regalar a otra pareja).
  IF w.plan_active THEN RETURN jsonb_build_object('status', 'already_paid'); END IF;

  UPDATE public.weddings SET
    plan_active = true,
    paid_at = now(),
    stripe_session_id = 'regalo:' || g.code,
    stripe_payment_intent = g.stripe_payment_intent,
    updated_at = now()
  WHERE id = w.id;
  UPDATE public.gift_codes SET redeemed_at = now(), redeemed_by = auth.uid() WHERE id = g.id;
  RETURN jsonb_build_object('status', 'ok', 'from_name', g.from_name);
END;
$$;

REVOKE ALL ON FUNCTION public.gift_preview(text) FROM public;
REVOKE ALL ON FUNCTION public.gift_by_session(text) FROM public;
REVOKE ALL ON FUNCTION public.redeem_gift(text) FROM public;
GRANT EXECUTE ON FUNCTION public.gift_preview(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gift_by_session(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_gift(text) TO authenticated;
