-- Por defecto, los invitados pueden añadir acompañantes y niños desde su enlace.
ALTER TABLE public.weddings ALTER COLUMN rsvp_allow_plus SET DEFAULT true;
UPDATE public.weddings SET rsvp_allow_plus = true;
