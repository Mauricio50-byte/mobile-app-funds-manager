import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Uploader {
  private supabase: SupabaseClient | null = null;

  constructor() {
    // No inicializar Supabase en el constructor para evitar problemas de dependencia circular
  }

  private getSupabaseClient(): SupabaseClient {
    if (!this.supabase) {
      console.log('Initializing Supabase client...');
      console.log('Environment object:', environment);
      console.log('Environment supabase:', (environment as any).supabase);
      
      const env = environment as any;
      if (!env) {
        console.error('Environment is null or undefined');
        throw new Error('Environment no está definido');
      }
      
      if (!env.supabase) {
        console.error('Supabase config not found in environment:', env);
        throw new Error('Configuración de Supabase no encontrada en environment');
      }
      
      if (!env.supabase.url || !env.supabase.anonKey) {
        console.error('Supabase URL or anonKey missing:', env.supabase);
        throw new Error('URL o anonKey de Supabase no encontrados');
      }
      
      console.log('Creating Supabase client with URL:', env.supabase.url);
      this.supabase = createClient(
        env.supabase.url, 
        env.supabase.anonKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      );
    }
    return this.supabase;
  }

  // REMOVIDO: No intentar crear bucket programáticamente
  // El bucket debe existir y ser creado manualmente en el dashboard

  async uploadImage(file: File, userUid?: string): Promise<UploadResult> {
    try {
      console.log('🚀 Iniciando subida de imagen:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userUid: userUid
      });

      if (!file) {
        console.error('❌ Error: No se proporcionó archivo');
        return {
          success: false,
          error: 'No se proporcionó archivo'
        };
      }

      // Verificar y crear el bucket si no existe
      console.log('🔍 Verificando si el bucket "wallpapers-app" existe...');
      await this.ensureBucketExists();

      // Genero un nombre único para el archivo
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;
      
      // Creo la ruta del archivo incluyendo el UID del usuario si está disponible
      const filePath = userUid ? `wallpapers-app/${userUid}/${fileName}` : `wallpapers-app/public/${fileName}`;
      
      console.log('📁 Ruta del archivo generada:', filePath);
      console.log('👤 Usuario autenticado:', userUid ? 'Sí' : 'No (archivo público)');

      // Subo el archivo a Supabase Storage
      console.log('⬆️ Subiendo archivo a Supabase Storage...');
      const supabase = this.getSupabaseClient();
      const { data, error } = await supabase.storage
        .from('wallpapers-app')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Error subiendo archivo a Supabase:', error);
        console.error('📋 Detalles del error:', {
          message: error.message,
          name: error.name || 'StorageError'
        });
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Archivo subido exitosamente a Supabase Storage!');
      console.log('📊 Datos de subida:', data);

      // Para bucket público, usar getPublicUrl en lugar de signedUrl
      console.log('🔗 Generando URL pública...');
      const { data: urlData } = supabase.storage
        .from('wallpapers-app')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        console.log('⚠️ No se pudo generar URL pública, usando URL firmada como fallback...');
        // Fallback a signed URL si no hay public URL
        const { data: signedUrlData } = await supabase.storage
          .from('wallpapers-app')
          .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 año

        console.log('🔐 URL firmada generada:', signedUrlData?.signedUrl);
        return {
          success: true,
          url: signedUrlData?.signedUrl || '',
          path: filePath
        };
      }

      console.log('🌐 URL pública generada:', urlData.publicUrl);
      console.log('🎉 Subida completada exitosamente!');
      console.log('📍 Ubicación final del archivo:', `Bucket: wallpapers-app, Path: ${filePath}`);
      
      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath
      };

    } catch (error) {
      console.error('Error en uploadImage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Eliminar imágenes de Supabase Storage
  async deleteImage(imagePath: string): Promise<boolean> {
    try {
      if (!imagePath) {
        console.warn('No se proporcionó ruta de imagen para eliminar');
        return false;
      }

      const supabase = this.getSupabaseClient();
      const { error } = await supabase.storage
        .from('wallpapers-app')
        .remove([imagePath]);

      if (error) {
        console.error('Error eliminando archivo de Supabase:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en deleteImage:', error);
      return false;
    }
  }

  // Generar nueva URL firmada para una imagen existente
  async getSignedUrl(imagePath: string, expiresIn: number = 60 * 60 * 24): Promise<string | null> {
    try {
      if (!imagePath) {
        return null;
      }

      const supabase = this.getSupabaseClient();
      
      // Para bucket público, usar getPublicUrl primero
      const { data: publicData } = supabase.storage
        .from('wallpapers-app')
        .getPublicUrl(imagePath);

      if (publicData?.publicUrl) {
        return publicData.publicUrl;
      }

      // Fallback a signed URL
      const { data, error } = await supabase.storage
        .from('wallpapers-app')
        .createSignedUrl(imagePath, expiresIn);

      if (error) {
        console.error('Error generando URL firmada:', error);
        return null;
      }

      return data?.signedUrl || null;
    } catch (error) {
      console.error('Error en getSignedUrl:', error);
      return null;
    }
  }

  // Obtener información del archivo sin descargarlo
  async getFileInfo(imagePath: string): Promise<any> {
    try {
      const supabase = this.getSupabaseClient();
      const pathParts = imagePath.split('/');
      const fileName = pathParts.pop();
      const folderPath = pathParts.join('/');

      const { data, error } = await supabase.storage
        .from('wallpapers-app')
        .list(folderPath, {
          search: fileName
        });

      if (error) {
        console.error('Error obteniendo información del archivo:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error en getFileInfo:', error);
      return null;
    }
  }

  // Verificar y crear el bucket si no existe
  private async ensureBucketExists(): Promise<void> {
    try {
      const supabase = this.getSupabaseClient();
      
      // Primero intentar hacer una operación simple en el bucket para verificar si existe
      const { data: testData, error: testError } = await supabase.storage
        .from('wallpapers-app')
        .list('', { limit: 1 });

      if (!testError) {
        console.log('✅ El bucket "wallpapers-app" ya existe y es accesible');
        return;
      }

      // Si el error es "Bucket not found", intentamos crear el bucket
      if (testError.message?.includes('Bucket not found')) {
        console.log('🔨 El bucket no existe, intentando crearlo...');
        
        const { data: createData, error: createError } = await supabase.storage.createBucket('wallpapers-app', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 10485760 // 10MB límite
        });

        if (createError) {
          // Si hay error de RLS, significa que el usuario no puede crear buckets
          if (createError.message?.includes('row-level security policy')) {
            console.warn('⚠️ No se puede crear el bucket automáticamente debido a políticas RLS.');
            console.warn('📋 Por favor, crea el bucket "wallpapers-app" manualmente en el dashboard de Supabase.');
            console.warn('🔧 O ejecuta las políticas SQL desde supabase-storage-policies.sql');
            
            // Intentar continuar asumiendo que el bucket existe
            return;
          }
          
          console.error('❌ Error creando bucket:', createError);
          throw new Error(`Error creando bucket: ${createError.message}`);
        }

        console.log('✅ Bucket "wallpapers-app" creado exitosamente');
      } else {
        // Otro tipo de error, pero intentamos continuar
        console.warn('⚠️ Error verificando bucket, pero continuando:', testError.message);
      }
      
    } catch (error) {
      console.warn('⚠️ Error en ensureBucketExists, pero continuando con la subida:', error);
      // No lanzamos el error para permitir que la subida continúe
      // El bucket podría existir pero tener problemas de permisos de listado
    }
  }
}