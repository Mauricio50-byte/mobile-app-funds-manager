-- Eliminar cualquier política previa de debugging
DROP POLICY IF EXISTS "Allow all operations for debugging" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations for debugging" ON storage.buckets;

-- Permitir TODO en storage.objects
CREATE POLICY "Allow all operations for debugging" 
ON storage.objects
FOR ALL
USING (true)
WITH CHECK (true);

-- Permitir TODO en storage.buckets
CREATE POLICY "Allow all operations for debugging" 
ON storage.buckets
FOR ALL
USING (true)
WITH CHECK (true);

-- Mensaje informativo
SELECT '🔓 DEBUG: acceso abierto en storage.objects y storage.buckets' as status;
