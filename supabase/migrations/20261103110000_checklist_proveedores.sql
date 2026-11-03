-- Checklist: responsable (las notas ya existían). Proveedores: teléfono y email por separado.
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS owner text NOT NULL DEFAULT '';
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '';
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';
