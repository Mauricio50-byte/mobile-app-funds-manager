import { Injectable } from '@angular/core';
import { Observable, from, map, switchMap, catchError, of, retry, timer, throwError } from 'rxjs';
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
import { SupabaseService } from './supabase.service';
import WallpaperPlugin from '../../plugins/wallpaper-plugin';
import { Platform } from '@ionic/angular';
import { ToastController } from '@ionic/angular';

// Aquí creé el servicio para manejar toda la lógica de negocio de wallpapers
// Implementé CRUD completo en Firestore, autenticación y subida de archivos

@Injectable({
  providedIn: 'root'
})
export class WallpaperService {
  private readonly collectionName = 'wallpapers';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 segundo

  constructor(
    private firestore: Firestore,
    private uploader: Uploader,
    private authService: Auth,
    private supabaseService: SupabaseService,
    private platform: Platform,
    private toastController: ToastController
  ) {}

  /**
   * Manejo de errores con reintentos para operaciones de Firestore
   */
  private handleFirestoreError<T>(operation: string) {
    return (error: any): Observable<T> => {
      console.error(`Error en ${operation}:`, error);
      
      // Verificar si es un error de conectividad
      if (this.isConnectivityError(error)) {
        console.log(`Reintentando ${operation} debido a error de conectividad...`);
        return throwError(() => new Error('No se puede conectar con la base de datos. Verifica tu conexión e intenta nuevamente.'));
      }
      
      // Verificar si es un error de permisos
      if (this.isPermissionError(error)) {
        return throwError(() => new Error('Permisos insuficientes. Inicia sesión e intenta nuevamente.'));
      }
      
      // Error genérico
      return throwError(() => new Error(`Error inesperado al ${operation.toLowerCase()}. Intenta nuevamente.`));
    };
  }

  /**
   * Verificar si es un error de conectividad
   */
  private isConnectivityError(error: any): boolean {
    const connectivityErrors = [
      'Could not reach Cloud Firestore backend',
      'Backend didn\'t respond within',
      'net::ERR_ABORTED',
      'Failed to fetch',
      'Network request failed'
    ];
    
    const errorMessage = error?.message || error?.toString() || '';
    return connectivityErrors.some(msg => errorMessage.includes(msg));
  }

  /**
   * Verificar si es un error de permisos
   */
  private isPermissionError(error: any): boolean {
    const permissionErrors = [
      'Missing or insufficient permissions',
      'Permission denied',
      'PERMISSION_DENIED'
    ];
    
    const errorMessage = error?.message || error?.toString() || '';
    return permissionErrors.some(msg => errorMessage.includes(msg));
  }

  /**
   * Operador de reintento con delay exponencial
   */
  private retryWithBackoff<T>() {
    return (source: Observable<T>) => source.pipe(
      retry({
        count: this.maxRetries,
        delay: (error, retryCount) => {
          if (this.isConnectivityError(error)) {
            const delay = this.retryDelay * Math.pow(2, retryCount - 1);
            console.log(`Reintentando en ${delay}ms (intento ${retryCount}/${this.maxRetries})`);
            return timer(delay);
          }
          return throwError(() => error);
        }
      })
    );
  }

  // Aquí implementé el método para crear un nuevo wallpaper con subida a Supabase
  createWallpaper(wallpaperData: CreateWallpaperData): Observable<string> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) {
          throw new Error('Usuario no autenticado');
        }

        // Primero comprimir y subir la imagen a Supabase
        return from(this.supabaseService.compressImage(wallpaperData.imageFile, 1920, 0.8)).pipe(
          switchMap(compressedFile => {
            return from(this.supabaseService.uploadWallpaper(compressedFile, user.uid));
          }),
          switchMap(uploadResult => {
            if (uploadResult.error || !uploadResult.data) {
              throw new Error(uploadResult.error?.message || 'Error al subir la imagen a Supabase');
            }

            // Obtener URL firmada para el archivo subido
            return from(this.supabaseService.getSignedUrl(uploadResult.data.path, 31536000)).pipe( // 1 año
              switchMap(urlResult => {
                if (urlResult.error || !urlResult.data) {
                  throw new Error('Error al obtener URL firmada');
                }

                const newWallpaper: Omit<WallpaperData, 'id'> = {
                  uid: user.uid,
                  title: wallpaperData.title,
                  description: wallpaperData.description || '',
                  supabaseUrl: urlResult.data.signedUrl,
                  imagePath: uploadResult.data.path,
                  tags: wallpaperData.tags || [],
                  category: wallpaperData.category || '',
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
                  this.retryWithBackoff(),
                  map(docRef => docRef.id)
                );
              })
            );
          })
        );
      }),
      catchError(this.handleFirestoreError<string>('crear wallpaper'))
    );
  }

  /**
   * Actualizar URL firmada de Supabase para un wallpaper
   */
  async refreshSupabaseUrl(wallpaper: WallpaperData): Promise<string> {
    try {
      const urlResult = await this.supabaseService.getSignedUrl(wallpaper.imagePath, 31536000); // 1 año
      if (urlResult.error || !urlResult.data) {
        throw new Error('Error al obtener nueva URL firmada');
      }

      // Actualizar en Firestore
      if (!wallpaper.id) {
        throw new Error('ID del wallpaper no encontrado');
      }
      
      const wallpaperDoc = doc(this.firestore, this.collectionName, wallpaper.id);
      await updateDoc(wallpaperDoc, {
        supabaseUrl: urlResult.data.signedUrl,
        updatedAt: Timestamp.fromDate(new Date())
      });

      return urlResult.data.signedUrl;
    } catch (error) {
      console.error('Error refreshing Supabase URL:', error);
      throw error;
    }
  }

  // Aquí desarrollé el método para obtener wallpapers con sistema de filtros avanzado
  getWallpapers(filter: WallpaperFilter = {}): Observable<WallpaperData[]> {
    const wallpapersCollection = collection(this.firestore, this.collectionName);
    let q = query(wallpapersCollection);

    // Aplicar filtros
    if (filter.uid) {
      q = query(q, where('uid', '==', filter.uid));
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
      this.retryWithBackoff(),
      map(snapshot => 
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()['createdAt']?.toDate() || new Date(),
          updatedAt: doc.data()['updatedAt']?.toDate() || new Date()
        } as WallpaperData))
      ),
      catchError(this.handleFirestoreError<WallpaperData[]>('obtener wallpapers'))
    );
  }

  // Aquí creé el método para obtener solo los wallpapers del usuario autenticado
  getUserWallpapers(): Observable<WallpaperData[]> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }
        return this.getWallpapers({ uid: user.uid });
      })
    );
  }

  // Aquí implementé el método para obtener wallpapers públicos disponibles para todos
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
            if (wallpaper.uid !== user.uid) {
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
            if (wallpaper.uid !== user.uid) {
              throw new Error('No tienes permisos para eliminar este wallpaper');
            }

            // Eliminar la imagen de Supabase
            return from(this.supabaseService.deleteWallpaper(wallpaper.imagePath)).pipe(
              switchMap(deleteResult => {
                if (deleteResult.error) {
                  console.warn('Error eliminando archivo de Supabase:', deleteResult.error);
                  // Continuar con la eliminación del documento aunque falle la eliminación del archivo
                }
                
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

  // Aquí desarrollé el método de búsqueda por título o descripción
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

  /**
   * Establecer wallpaper en la pantalla principal
   */
  async setWallpaperHomeScreen(imageUrl: string): Promise<boolean> {
    if (!this.platform.is('android')) {
      await this.showToast('Esta funcionalidad solo está disponible en Android', 'warning');
      return false;
    }

    try {
      await this.showToast('Estableciendo wallpaper...', 'primary');
      
      const result = await WallpaperPlugin.setWallpaperHomeScreen({ imageUrl });
      
      if (result.success) {
        await this.showToast('Wallpaper establecido correctamente en la pantalla principal', 'success');
        return true;
      } else {
        await this.showToast('Error al establecer wallpaper: ' + result.message, 'danger');
        return false;
      }
    } catch (error: any) {
      console.error('Error setting home screen wallpaper:', error);
      await this.showToast('Error al establecer wallpaper: ' + (error.message || 'Error desconocido'), 'danger');
      return false;
    }
  }

  /**
   * Establecer wallpaper en la pantalla de bloqueo
   */
  async setWallpaperLockScreen(imageUrl: string): Promise<boolean> {
    if (!this.platform.is('android')) {
      await this.showToast('Esta funcionalidad solo está disponible en Android', 'warning');
      return false;
    }

    try {
      await this.showToast('Estableciendo wallpaper de bloqueo...', 'primary');
      
      const result = await WallpaperPlugin.setWallpaperLockScreen({ imageUrl });
      
      if (result.success) {
        await this.showToast('Wallpaper establecido correctamente en la pantalla de bloqueo', 'success');
        return true;
      } else {
        await this.showToast('Error al establecer wallpaper: ' + result.message, 'danger');
        return false;
      }
    } catch (error: any) {
      console.error('Error setting lock screen wallpaper:', error);
      await this.showToast('Error al establecer wallpaper: ' + (error.message || 'Error desconocido'), 'danger');
      return false;
    }
  }

  /**
   * Establecer wallpaper en ambas pantallas
   */
  async setBothWallpapers(imageUrl: string): Promise<boolean> {
    if (!this.platform.is('android')) {
      await this.showToast('Esta funcionalidad solo está disponible en Android', 'warning');
      return false;
    }

    try {
      await this.showToast('Estableciendo wallpaper en ambas pantallas...', 'primary');
      
      const result = await WallpaperPlugin.setBothWallpapers({ imageUrl });
      
      if (result.success) {
        await this.showToast('Wallpaper establecido correctamente en ambas pantallas', 'success');
        return true;
      } else {
        await this.showToast('Error al establecer wallpaper: ' + result.message, 'danger');
        return false;
      }
    } catch (error: any) {
      console.error('Error setting both wallpapers:', error);
      await this.showToast('Error al establecer wallpaper: ' + (error.message || 'Error desconocido'), 'danger');
      return false;
    }
  }

  /**
   * Verificar permisos del plugin
   */
  async checkWallpaperPermissions(): Promise<boolean> {
    if (!this.platform.is('android')) {
      return false;
    }

    try {
      const result = await WallpaperPlugin.checkPermissions();
      return result.hasPermission;
    } catch (error) {
      console.error('Error checking wallpaper permissions:', error);
      return false;
    }
  }

  /**
   * Mostrar toast con mensaje
   */
  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}