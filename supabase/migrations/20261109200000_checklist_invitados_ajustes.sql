-- Checklist guiado: prioridad, pasos y "no aplica".
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS priority text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS steps jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS not_applicable boolean NOT NULL DEFAULT false;

-- Invitados: niños y alergias / dieta.
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS is_child boolean NOT NULL DEFAULT false;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS allergies text[] NOT NULL DEFAULT '{}';

-- Sugerencias que mandan las parejas desde Ajustes (solo se pueden escribir, no leer).
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "send own feedback" ON public.feedback;
CREATE POLICY "send own feedback" ON public.feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Borrar la propia cuenta: elimina el usuario y, en cascada, su boda y todos sus datos.
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
REVOKE ALL ON FUNCTION public.delete_my_account() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
