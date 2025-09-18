import { Injectable } from '@angular/core';
import { Query } from '../services/query';
import { AuthProvider } from './auth.provider';
import { Uploader, UploadResult } from '../services/uploader';
import { 
  WallpaperData, 
  WallpaperFilter, 
  CreateWallpaperData, 
  UpdateWallpaperData 
} from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class WallpaperProvider {

  constructor(
    private query: Query,
    private authProvider: AuthProvider,
    private uploader: Uploader
  ) {}

  /**
   * Crea un nuevo wallpaper
   */
  async createWallpaper(wallpaperData: CreateWallpaperData): Promise<WallpaperData> {
    try {
      const currentUser = this.authProvider.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      // Subir la imagen
      const uploadResult: UploadResult = await this.uploader.uploadFile(
        wallpaperData.imageFile,
        `wallpapers/${currentUser.uid}`
      );

      // Crear el documento del wallpaper
      const newWallpaper: Omit<WallpaperData, 'id'> = {
        userId: currentUser.uid,
        title: wallpaperData.title,
        description: wallpaperData.description,
        imageUrl: uploadResult.downloadURL,
        imagePath: uploadResult.fullPath,
        tags: wallpaperData.tags || [],
        isPublic: wallpaperData.isPublic,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docId = await this.query.createDocumentWithAutoId('wallpapers', newWallpaper);
      
      return {
        id: docId,
        ...newWallpaper
      };
    } catch (error) {
      console.error('Error creando wallpaper:', error);
      throw error;
    }
  }

  /**
   * Obtiene wallpapers del usuario actual
   */
  async getUserWallpapers(filter?: Partial<WallpaperFilter>): Promise<WallpaperData[]> {
    try {
      const currentUser = this.authProvider.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const conditions = [
        { field: 'userId', operator: '==' as const, value: currentUser.uid }
      ];

      if (filter?.tags && filter.tags.length > 0) {
        conditions.push({
          field: 'tags',
          operator: 'array-contains-any' as const,
          value: filter.tags
        });
      }

      const orderBy = filter?.orderBy || 'createdAt';
      const orderDirection = filter?.orderDirection || 'desc';

      const documents = await this.query.queryDocuments(
        'wallpapers',
        conditions,
        orderBy,
        orderDirection,
        filter?.limit
      );

      return documents as WallpaperData[];
    } catch (error) {
      console.error('Error obteniendo wallpapers del usuario:', error);
      throw error;
    }
  }

  /**
   * Obtiene wallpapers públicos
   */
  async getPublicWallpapers(filter?: Partial<WallpaperFilter>): Promise<WallpaperData[]> {
    try {
      const conditions = [
        { field: 'isPublic', operator: '==' as const, value: true }
      ];

      if (filter?.tags && filter.tags.length > 0) {
        conditions.push({
          field: 'tags',
          operator: 'array-contains-any' as const,
          value: filter.tags
        });
      }

      const orderBy = filter?.orderBy || 'createdAt';
      const orderDirection = filter?.orderDirection || 'desc';

      const documents = await this.query.queryDocuments(
        'wallpapers',
        conditions,
        orderBy,
        orderDirection,
        filter?.limit
      );

      return documents as WallpaperData[];
    } catch (error) {
      console.error('Error obteniendo wallpapers públicos:', error);
      throw error;
    }
  }

  /**
   * Obtiene un wallpaper por ID
   */
  async getWallpaperById(id: string): Promise<WallpaperData | null> {
    try {
      const wallpaper = await this.query.getDocument('wallpapers', id);
      return wallpaper ? { id, ...wallpaper } as WallpaperData : null;
    } catch (error) {
      console.error('Error obteniendo wallpaper:', error);
      throw error;
    }
  }

  /**
   * Actualiza un wallpaper
   */
  async updateWallpaper(id: string, updateData: UpdateWallpaperData): Promise<void> {
    try {
      const currentUser = this.authProvider.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      // Verificar que el wallpaper pertenece al usuario
      const wallpaper = await this.getWallpaperById(id);
      if (!wallpaper || wallpaper.userId !== currentUser.uid) {
        throw new Error('No tienes permisos para actualizar este wallpaper');
      }

      const updatedData = {
        ...updateData,
        updatedAt: new Date()
      };

      await this.query.updateDocument('wallpapers', id, updatedData);
    } catch (error) {
      console.error('Error actualizando wallpaper:', error);
      throw error;
    }
  }

  /**
   * Elimina un wallpaper
   */
  async deleteWallpaper(id: string): Promise<void> {
    try {
      const currentUser = this.authProvider.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      // Verificar que el wallpaper pertenece al usuario
      const wallpaper = await this.getWallpaperById(id);
      if (!wallpaper || wallpaper.userId !== currentUser.uid) {
        throw new Error('No tienes permisos para eliminar este wallpaper');
      }

      // Eliminar la imagen del storage
      await this.uploader.deleteFile(wallpaper.imagePath);

      // Eliminar el documento
      await this.query.deleteDocument('wallpapers', id);
    } catch (error) {
      console.error('Error eliminando wallpaper:', error);
      throw error;
    }
  }

  /**
   * Busca wallpapers por título o descripción
   */
  async searchWallpapers(searchTerm: string, isPublicOnly: boolean = true): Promise<WallpaperData[]> {
    try {
      // Nota: Firestore no soporta búsqueda de texto completo nativa
      // Esta es una implementación básica que obtiene todos los documentos y filtra
      const conditions = [];
      
      if (isPublicOnly) {
        conditions.push({ field: 'isPublic', operator: '==' as const, value: true });
      } else {
        const currentUser = this.authProvider.getCurrentUser();
        if (currentUser) {
          conditions.push({ field: 'userId', operator: '==' as const, value: currentUser.uid });
        }
      }

      const documents = await this.query.queryDocuments(
        'wallpapers',
        conditions,
        'createdAt',
        'desc'
      );

      // Filtrar por término de búsqueda
      const searchTermLower = searchTerm.toLowerCase();
      return (documents as WallpaperData[]).filter(wallpaper => 
        wallpaper.title.toLowerCase().includes(searchTermLower) ||
        (wallpaper.description && wallpaper.description.toLowerCase().includes(searchTermLower)) ||
        (wallpaper.tags && wallpaper.tags.some(tag => tag.toLowerCase().includes(searchTermLower)))
      );
    } catch (error) {
      console.error('Error buscando wallpapers:', error);
      throw error;
    }
  }
}