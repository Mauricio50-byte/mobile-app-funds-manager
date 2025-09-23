export interface WallpaperData {
  id?: string;
  uid: string; // UID de Firebase del usuario propietario
  title: string;
  description?: string;
  imageUrl: string; // URL del archivo en Firebase Storage
  thumbnailUrl?: string; // Miniatura optimizada
  imagePath: string; // Ruta en Firebase Storage
  tags?: string[];
  category?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WallpaperFilter {
  uid?: string; // UID de Firebase para filtrar por usuario
  isPublic?: boolean;
  tags?: string[];
  category?: string;
  limit?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'title';
  orderDirection?: 'asc' | 'desc';
}

export interface CreateWallpaperData {
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  isPublic: boolean;
  imageFile: File;
}

export interface UploadWallpaperResponse {
  success: boolean;
  wallpaper?: WallpaperData;
  error?: string;
}

export interface UpdateWallpaperData {
  title?: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
}