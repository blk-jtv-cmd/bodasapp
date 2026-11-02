-- Una sola boda por cuenta.
-- 1) Limpia las bodas repetidas: por cada usuario se queda la pagada (si la hay) o la más antigua.
--    Las demás se borran junto con lo que tuvieran dentro.
-- 2) Añade la regla para que no vuelva a pasar.
WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY user_id ORDER BY plan_active DESC, created_at ASC) AS rn
  FROM public.weddings
)
DELETE FROM public.weddings w
USING ranked r
WHERE w.id = r.id AND r.rn > 1;

ALTER TABLE public.weddings
  ADD CONSTRAINT weddings_one_per_user UNIQUE (user_id);
