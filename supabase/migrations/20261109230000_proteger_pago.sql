-- Seguridad: solo el webhook de Stripe (service_role) puede marcar una boda como pagada.
-- Antes, la regla "own wedding" dejaba a cada usuario cambiar cualquier columna de su boda,
-- también plan_active, desde la consola del navegador. Este trigger ignora esos cambios
-- cuando vienen de la app (roles anon / authenticated).
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
    ELSE
      NEW.plan_active := OLD.plan_active;
      NEW.paid_at := OLD.paid_at;
      NEW.stripe_session_id := OLD.stripe_session_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_wedding_payment ON public.weddings;
CREATE TRIGGER protect_wedding_payment
BEFORE INSERT OR UPDATE ON public.weddings
FOR EACH ROW EXECUTE FUNCTION public.protect_wedding_payment();
