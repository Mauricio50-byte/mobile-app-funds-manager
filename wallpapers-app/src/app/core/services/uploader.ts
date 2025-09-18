import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Auth } from './auth';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class Uploader {
  private supabase: SupabaseClient;
  private readonly BUCKET_NAME = 'wallpapers';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  constructor(private auth: Auth) {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }

  /**
   * Verifica si Supabase está configurado correctamente
   */
  isConfigured(): boolean {
    return environment.supabase.url !== 'https://nxarxomkgbbvqxinfnbn.supabase.co' && 
            environment.supabase.anonKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YXJ4b21rZ2JidnF4aW5mbmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTI4NDgsImV4cCI6MjA3Mzc4ODg0OH0.qr3rMqs0UZMQtgBT-prn6qYEUZ26oPMBCwCvUOdgaxA';
  }

  /**
   * Sube una imagen a Supabase Storage
   */
  async uploadImage(file: File, onProgress?: (progress: UploadProgress) => void): Promise<UploadResult> {
    try {
      // Verificar configuración de Supabase
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Supabase no está configurado correctamente'
        };
      }

      // Verificar autenticación
      const user = await this.auth.getCurrentUser();
      if (!user) {
        return {
          success: false,
          error: 'Usuario no autenticado'
        };
      }

      // Validar archivo
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Generar nombre único para el archivo
      const fileName = this.generateFileName(file, user.uid);
      const filePath = `${user.uid}/${fileName}`;

      console.log('Subiendo imagen:', fileName);

      // Subir archivo a Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error al subir imagen:', error);
        return {
          success: false,
          error: `Error al subir imagen: ${error.message}`
        };
      }

      // Obtener URL pública
      const { data: urlData } = this.supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      console.log('Imagen subida exitosamente:', urlData.publicUrl);

      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath
      };

    } catch (error) {
      console.error('Error inesperado al subir imagen:', error);
      return {
        success: false,
        error: 'Error inesperado al subir la imagen'
      };
    }
  }

  /**
   * Elimina una imagen de Supabase Storage
   */
  async deleteImage(filePath: string): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.error('Supabase no está configurado');
        return false;
      }

      const { error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Error al eliminar imagen:', error);
        return false;
      }

      console.log('Imagen eliminada exitosamente:', filePath);
      return true;

    } catch (error) {
      console.error('Error inesperado al eliminar imagen:', error);
      return false;
    }
  }

  /**
   * Obtiene la URL pública del bucket de storage
   */
  getStorageUrl(bucket: string = this.BUCKET_NAME): string {
    return `${environment.supabase.url}/storage/v1/object/public/${bucket}`;
  }

  /**
   * Valida el archivo antes de subirlo
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    // Verificar tipo de archivo
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de archivo no permitido. Solo se permiten imágenes JPEG, PNG y WebP'
      };
    }

    // Verificar tamaño
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'El archivo es demasiado grande. Máximo 10MB'
      };
    }

    return { valid: true };
  }

  /**
   * Genera un nombre único para el archivo
   */
  private generateFileName(file: File, userId: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    
    return `wallpaper_${timestamp}_${randomString}.${extension}`;
  }

  /**
   * Obtiene el tamaño máximo permitido en MB
   */
  getMaxFileSize(): number {
    return this.MAX_FILE_SIZE / (1024 * 1024);
  }

  /**
   * Obtiene los tipos de archivo permitidos
   */
  getAllowedTypes(): string[] {
    return [...this.ALLOWED_TYPES];
  }
}
