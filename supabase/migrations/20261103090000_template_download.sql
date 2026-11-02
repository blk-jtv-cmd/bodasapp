-- Carpeta privada para la plantilla en Excel.
-- Solo las cuentas con el plan pagado pueden descargar sus archivos.
INSERT INTO storage.buckets (id, name, public)
VALUES ('descargas', 'descargas', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Descargas solo con plan pagado" ON storage.objects;
CREATE POLICY "Descargas solo con plan pagado" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'descargas'
    AND EXISTS (
      SELECT 1 FROM public.weddings
      WHERE user_id = auth.uid() AND plan_active
    )
  );
