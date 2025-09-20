-- Políticas de acceso para el bucket 'wallpapers-app' en Supabase Storage
-- Ejecuta este script en el SQL Editor de tu dashboard de Supabase

-- 1. Política para permitir a usuarios autenticados subir archivos
CREATE POLICY "Allow authenticated users to upload wallpapers" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'wallpapers-app' 
  AND auth.role() = 'authenticated'
);

-- 2. Política para permitir acceso público de lectura a las imágenes
CREATE POLICY "Allow public access to wallpapers" ON storage.objects
FOR SELECT USING (bucket_id = 'wallpapers-app');

-- 3. Política para permitir a usuarios eliminar sus propios archivos
CREATE POLICY "Allow users to delete their own wallpapers" ON storage.objects
FOR DELETE USING (
  bucket_id = 'wallpapers-app' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Política para permitir a usuarios actualizar sus propios archivos
CREATE POLICY "Allow users to update their own wallpapers" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'wallpapers-app' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Opcional: Si quieres permitir acceso anónimo para subir archivos públicos
-- (descomenta la siguiente línea si es necesario)
-- CREATE POLICY "Allow anonymous uploads to public folder" ON storage.objects
-- FOR INSERT WITH CHECK (
--   bucket_id = 'wallpapers-app' 
--   AND (storage.foldername(name))[1] = 'public'
-- );