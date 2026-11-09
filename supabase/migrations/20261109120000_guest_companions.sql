-- Acompañantes como invitados propios, enlazados con el invitado con el que vienen.
-- Si se borra ese invitado, se borran también sus acompañantes.
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS companion_of uuid REFERENCES public.guests(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS guests_companion_of_idx ON public.guests(companion_of);
