import { Injectable } from '@angular/core';
import { Observable, from, map, switchMap, catchError, of } from 'rxjs';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from '@angular/fire/firestore';
import { WallpaperData, WallpaperFilter, CreateWallpaperData, UpdateWallpaperData } from '../interfaces/wallpaper.interface';
import { Uploader } from './uploader';
import { Auth } from './auth';

/**
 * Servicio para manejar la lógica de negocio de wallpapers
 * Responsabilidad: CRUD de wallpapers en Firestore, autenticación, subida de archivos
 * */

@Injectable({
  providedIn: 'root'
})
export class WallpaperService {
  private readonly collectionName = 'wallpapers';

  constructor(
    private firestore: Firestore,
    private uploader: Uploader,
    private authService: Auth
  ) {}

  /**
   * Crear un nuevo wallpaper
   */
  createWallpaper(wallpaperData: CreateWallpaperData): Observable<string> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) {
          throw new Error('Usuario no autenticado');
        }

        // Primero subir la imagen a Supabase
        return from(this.uploader.uploadImage(wallpaperData.imageFile)).pipe(
          switchMap(uploadResult => {
            if (!uploadResult.success || !uploadResult.url || !uploadResult.path) {
              throw new Error(uploadResult.error || 'Error al subir la imagen');
            }

            const newWallpaper: Omit<WallpaperData, 'id'> = {
              userId: user.uid,
              title: wallpaperData.title,
              description: wallpaperData.description || '',
              imageUrl: uploadResult.url,
              imagePath: uploadResult.path,
              tags: wallpaperData.tags || [],
              isPublic: wallpaperData.isPublic,
              createdAt: new Date(),
              updatedAt: new Date()
            };

            const wallpapersCollection = collection(this.firestore, this.collectionName);
            return from(addDoc(wallpapersCollection, {
              ...newWallpaper,
              createdAt: Timestamp.fromDate(newWallpaper.createdAt),
              updatedAt: Timestamp.fromDate(newWallpaper.updatedAt)
            })).pipe(
              map(docRef => docRef.id)
            );
          })
        );
      }),
      catchError(error => {
        console.error('Error creating wallpaper:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener wallpapers con filtros
   */
  getWallpapers(filter: WallpaperFilter = {}): Observable<WallpaperData[]> {
    const wallpapersCollection = collection(this.firestore, this.collectionName);
    let q = query(wallpapersCollection);

    // Aplicar filtros
    if (filter.userId) {
      q = query(q, where('userId', '==', filter.userId));
    }

    if (filter.isPublic !== undefined) {
      q = query(q, where('isPublic', '==', filter.isPublic));
    }

    if (filter.tags && filter.tags.length > 0) {
      q = query(q, where('tags', 'array-contains-any', filter.tags));
    }

    // Ordenamiento
    const orderField = filter.orderBy || 'createdAt';
    const orderDirection = filter.orderDirection || 'desc';
    q = query(q, orderBy(orderField, orderDirection));

    // Límite
    if (filter.limit) {
      q = query(q, limit(filter.limit));
    }

    return from(getDocs(q)).pipe(
      map(snapshot => 
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()['createdAt']?.toDate() || new Date(),
          updatedAt: doc.data()['updatedAt']?.toDate() || new Date()
        } as WallpaperData))
      ),
      catchError(error => {
        console.error('Error getting wallpapers:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener wallpapers del usuario actual
   */
  getUserWallpapers(): Observable<WallpaperData[]> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }
        return this.getWallpapers({ userId: user.uid });
      })
    );
  }

  /**
   * Obtener wallpapers públicos
   */
  getPublicWallpapers(limitCount: number = 20): Observable<WallpaperData[]> {
    return this.getWallpapers({ 
      isPublic: true, 
      limit: limitCount 
    });
  }

  /**
   * Obtener un wallpaper por ID
   */
  getWallpaperById(id: string): Observable<WallpaperData | null> {
    const docRef = doc(this.firestore, this.collectionName, id);
    return from(getDoc(docRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: data['createdAt']?.toDate() || new Date(),
            updatedAt: data['updatedAt']?.toDate() || new Date()
          } as WallpaperData;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error getting wallpaper:', error);
        return of(null);
      })
    );
  }

  /**
   * Actualizar un wallpaper
   */
  updateWallpaper(id: string, updateData: UpdateWallpaperData): Observable<void> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) {
          throw new Error('Usuario no autenticado');
        }

        // Verificar que el wallpaper pertenece al usuario
        return this.getWallpaperById(id).pipe(
          switchMap(wallpaper => {
            if (!wallpaper) {
              throw new Error('Wallpaper no encontrado');
            }
            if (wallpaper.userId !== user.uid) {
              throw new Error('No tienes permisos para actualizar este wallpaper');
            }

            const docRef = doc(this.firestore, this.collectionName, id);
            const updatePayload = {
              ...updateData,
              updatedAt: Timestamp.fromDate(new Date())
            };

            return from(updateDoc(docRef, updatePayload));
          })
        );
      }),
      catchError(error => {
        console.error('Error updating wallpaper:', error);
        throw error;
      })
    );
  }

  /**
   * Eliminar un wallpaper
   */
  deleteWallpaper(id: string): Observable<void> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) {
          throw new Error('Usuario no autenticado');
        }

        // Verificar que el wallpaper pertenece al usuario
        return this.getWallpaperById(id).pipe(
          switchMap(wallpaper => {
            if (!wallpaper) {
              throw new Error('Wallpaper no encontrado');
            }
            if (wallpaper.userId !== user.uid) {
              throw new Error('No tienes permisos para eliminar este wallpaper');
            }

            // Eliminar la imagen de Supabase
            return from(this.uploader.deleteImage(wallpaper.imagePath)).pipe(
              switchMap(() => {
                // Eliminar el documento de Firestore
                const docRef = doc(this.firestore, this.collectionName, id);
                return from(deleteDoc(docRef));
              })
            );
          })
        );
      }),
      catchError(error => {
        console.error('Error deleting wallpaper:', error);
        throw error;
      })
    );
  }

  /**
   * Buscar wallpapers por título o descripción
   */
  searchWallpapers(searchTerm: string, isPublicOnly: boolean = true): Observable<WallpaperData[]> {
    // Esta es una implementación básica que filtra en el cliente
    const filter: WallpaperFilter = isPublicOnly ? { isPublic: true } : {};
    
    return this.getWallpapers(filter).pipe(
      map(wallpapers => 
        wallpapers.filter(wallpaper => 
          wallpaper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (wallpaper.description && wallpaper.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (wallpaper.tags && wallpaper.tags.some(tag => 
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          ))
        )
      )
    );
  }
}