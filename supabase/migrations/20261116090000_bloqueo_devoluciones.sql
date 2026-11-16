-- Para poder bloquear el plan si se devuelve el pago o se pierde una disputa,
-- se guarda el identificador del pago de Stripe (payment_intent) al activar.
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS stripe_payment_intent text;
CREATE INDEX IF NOT EXISTS weddings_stripe_payment_intent_idx ON public.weddings (stripe_payment_intent);

-- La app no puede tocar este campo (igual que plan_active, paid_at y stripe_session_id).
CREATE OR REPLACE FUNCTION public.protect_wedding_payment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.plan_active := false;
      NEW.paid_at := NULL;
      NEW.stripe_session_id := NULL;
      NEW.stripe_payment_intent := NULL;
    ELSE
      NEW.plan_active := OLD.plan_active;
      NEW.paid_at := OLD.paid_at;
      NEW.stripe_session_id := OLD.stripe_session_id;
      NEW.stripe_payment_intent := OLD.stripe_payment_intent;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
