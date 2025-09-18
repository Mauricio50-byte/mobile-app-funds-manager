export interface WallpaperData {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  imageUrl: string;
  imagePath: string;
  tags?: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WallpaperFilter {
  userId?: string;
  isPublic?: boolean;
  tags?: string[];
  limit?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'title';
  orderDirection?: 'asc' | 'desc';
}

export interface CreateWallpaperData {
  title: string;
  description?: string;
  tags?: string[];
  isPublic: boolean;
  imageFile: File;
}

export interface UpdateWallpaperData {
  title?: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
}