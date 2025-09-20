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

  // Subo imágenes a Supabase Storage y genero URLs firmadas
  private async ensureBucketExists(): Promise<void> {
    try {
      const supabase = this.getSupabaseClient();
      
      // Verificar si el bucket existe
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.warn('No se pudo verificar buckets:', listError);
        return;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === 'wallpapers-app');
      
      if (!bucketExists) {
        console.log('Bucket "wallpapers-app" no existe, intentando crear...');
        
        // Intentar crear el bucket
        const { error: createError } = await supabase.storage.createBucket('wallpapers-app', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 50 * 1024 * 1024 // 50MB
        });

        if (createError) {
          console.error('Error creando bucket:', createError);
        } else {
          console.log('Bucket "wallpapers" creado exitosamente');
        }
      }
    } catch (error) {
      console.warn('Error verificando/creando bucket:', error);
    }
  }

  async uploadImage(file: File, userUid?: string): Promise<UploadResult> {
    try {
      if (!file) {
        return {
          success: false,
          error: 'No se proporcionó archivo'
        };
      }

      // Verificar que el bucket existe
      await this.ensureBucketExists();

      // Genero un nombre único para el archivo
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;
      
      // Creo la ruta del archivo incluyendo el UID del usuario si está disponible
      const filePath = userUid ? `wallpapers-app/${userUid}/${fileName}` : `wallpapers-app/public/${fileName}`;

      // Subo el archivo a Supabase Storage
      const supabase = this.getSupabaseClient();
      const { data, error } = await supabase.storage
        .from('wallpapers-app')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error subiendo archivo a Supabase:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Genero URL firmada para acceder a la imagen
      const { data: urlData } = await supabase.storage
        .from('wallpapers-app')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // URL válida por 1 año

      if (!urlData?.signedUrl) {
        return {
          success: false,
          error: 'No se pudo generar la URL firmada'
        };
      }

      return {
        success: true,
        url: urlData.signedUrl,
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

  // Elimino imágenes de Supabase Storage
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

  // Genero nueva URL firmada para una imagen existente
  async getSignedUrl(imagePath: string, expiresIn: number = 60 * 60 * 24): Promise<string | null> {
    try {
      if (!imagePath) {
        return null;
      }

      const supabase = this.getSupabaseClient();
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

  // Obtengo información del archivo sin descargarlo
  async getFileInfo(imagePath: string): Promise<any> {
    try {
      const supabase = this.getSupabaseClient();
      const { data, error } = await supabase.storage
        .from('wallpapers-app')
        .list(imagePath.split('/').slice(0, -1).join('/'), {
          search: imagePath.split('/').pop()
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
}