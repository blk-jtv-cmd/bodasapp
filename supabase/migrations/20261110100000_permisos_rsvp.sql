-- En producción la tabla weddings solo deja editar columnas concretas a la app.
-- Se añaden las de las confirmaciones online.
GRANT UPDATE (rsvp_token, rsvp_open, rsvp_deadline, rsvp_allow_plus, rsvp_message) ON public.weddings TO authenticated;
