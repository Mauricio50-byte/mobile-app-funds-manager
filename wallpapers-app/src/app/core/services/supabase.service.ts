import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export interface WallpaperUpload {
  id?: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private readonly BUCKET_NAME = 'wallpapers';

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.anonKey);
  }

  /**
   * Subir un wallpaper al storage de Supabase
   */
  async uploadWallpaper(file: File, userId: string): Promise<{ data: any; error: any }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      return { data, error };
    } catch (error) {
      console.error('Error uploading wallpaper:', error);
      return { data: null, error };
    }
  }

  /**
   * Obtener URL firmada para un wallpaper
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(filePath, expiresIn);

      return { data, error };
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return { data: null, error };
    }
  }

  /**
   * Listar wallpapers de un usuario
   */
  async listUserWallpapers(userId: string): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .list(userId, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      return { data, error };
    } catch (error) {
      console.error('Error listing wallpapers:', error);
      return { data: null, error };
    }
  }

  /**
   * Eliminar un wallpaper
   */
  async deleteWallpaper(filePath: string): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      return { data, error };
    } catch (error) {
      console.error('Error deleting wallpaper:', error);
      return { data: null, error };
    }
  }

  /**
   * Obtener información del storage
   */
  async getStorageInfo(): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .list('', { limit: 1 });

      return { data, error };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { data: null, error };
    }
  }

  /**
   * Comprimir imagen antes de subir (opcional)
   */
  async compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo la proporción
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Dibujar imagen redimensionada
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convertir a blob y luego a File
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Si falla la compresión, devolver archivo original
          }
        }, file.type, quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }
}