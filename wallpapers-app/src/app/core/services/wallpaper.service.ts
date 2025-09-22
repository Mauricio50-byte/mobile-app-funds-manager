import { Injectable } from '@angular/core';
import { Observable, from, map, switchMap, catchError, of, retry, timer, throwError } from 'rxjs';
import { ToastController, Platform } from '@ionic/angular';
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
import { Auth } from './auth';
import { Uploader } from './uploader';
import WallpaperPlugin from '../../plugins/wallpaper-plugin';

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
    private platform: Platform,
    private toastController: ToastController
  ) {}

  /**
   * Manejo de errores con reintentos para operaciones de Firestore
   */
  private handleFirestoreError<T>(operation: string) {
    return (error: any): Observable<T> => {
      try {
        console.error(`Error en ${operation}:`, error);
        
        // Verificar si es un error de conectividad
        if (this.isConnectivityError(error)) {
          console.log(`Error de conectividad en ${operation}, devolviendo datos vacíos...`);
          this.showConnectivityToast();
          // Devolver datos vacíos en lugar de error para mantener la app funcionando
          return of([] as unknown as T);
        }
        
        // Verificar si es un error de permisos
        if (this.isPermissionError(error)) {
          console.log(`Error de permisos en ${operation}`);
          this.showPermissionToast();
          return of([] as unknown as T);
        }

        // Verificar errores específicos de Firestore
        if (this.isFirestoreIndexError(error)) {
          console.log(`Error de índice en ${operation}, usando consulta alternativa...`);
          this.showIndexToast();
          return of([] as unknown as T);
        }

        // Verificar errores de NavigatorLockAcquireTimeoutError
        if (this.isNavigatorLockError(error)) {
          console.log(`Error de lock timeout en ${operation}, reintentando...`);
          this.showLockTimeoutToast();
          return of([] as unknown as T);
        }
        
        // Error genérico - mostrar toast y devolver datos vacíos
        console.log(`Error genérico en ${operation}`);
        this.showGenericErrorToast(operation);
        return of([] as unknown as T);
        
      } catch (handlingError) {
        console.error('Error manejando error de Firestore:', handlingError);
        // Fallback final - devolver datos vacíos
        return of([] as unknown as T);
      }
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
   * Verificar si es un error de índice de Firestore
   */
  private isFirestoreIndexError(error: any): boolean {
    const indexErrors = [
      'requires an index',
      'composite index',
      'index not found',
      'INDEX_NOT_FOUND'
    ];
    
    const errorMessage = error?.message || error?.toString() || '';
    return indexErrors.some(msg => errorMessage.includes(msg));
  }

  /**
   * Verificar si es un error de NavigatorLockAcquireTimeoutError
   */
  private isNavigatorLockError(error: any): boolean {
    const lockErrors = [
      'NavigatorLockAcquireTimeoutError',
      'lock:sb-',
      'auth-token',
      'Acquiring an exclusive Navigator LockManager lock',
      'immediately failed'
    ];
    
    const errorMessage = error?.message || error?.toString() || '';
    return lockErrors.some(msg => errorMessage.includes(msg));
  }

  /**
   * Mostrar notificación de error de conectividad
   */
  private async showConnectivityToast() {
    try {
      const toast = await this.toastController.create({
        message: 'Sin conexión a internet. Mostrando datos guardados.',
        duration: 3000,
        position: 'bottom',
        color: 'warning',
        icon: 'wifi-outline'
      });
      await toast.present();
    } catch (error) {
      console.error('Error mostrando toast de conectividad:', error);
    }
  }

  /**
   * Mostrar notificación de error de permisos
   */
  private async showPermissionToast() {
    try {
      const toast = await this.toastController.create({
        message: 'Permisos insuficientes. Inicia sesión nuevamente.',
        duration: 4000,
        position: 'bottom',
        color: 'danger',
        icon: 'lock-closed-outline'
      });
      await toast.present();
    } catch (error) {
      console.error('Error mostrando toast de permisos:', error);
    }
  }

  /**
   * Mostrar notificación de error de índice
   */
  private async showIndexToast() {
    try {
      const toast = await this.toastController.create({
        message: 'Configurando base de datos. Intenta nuevamente en unos momentos.',
        duration: 4000,
        position: 'bottom',
        color: 'medium',
        icon: 'settings-outline'
      });
      await toast.present();
    } catch (error) {
      console.error('Error mostrando toast de índice:', error);
    }
  }

  /**
   * Mostrar notificación de error genérico
   */
  private async showGenericErrorToast(operation: string) {
    try {
      const toast = await this.toastController.create({
        message: `Error temporal en ${operation}. Intenta nuevamente.`,
        duration: 3000,
        position: 'bottom',
        color: 'danger',
        icon: 'alert-circle-outline'
      });
      await toast.present();
    } catch (error) {
      console.error('Error mostrando toast genérico:', error);
    }
  }

  /**
   * Mostrar notificación de error de lock timeout
   */
  private async showLockTimeoutToast() {
    try {
      const toast = await this.toastController.create({
        message: 'Error de autenticación temporal. Cerrando y abriendo sesión puede ayudar.',
        duration: 5000,
        position: 'bottom',
        color: 'warning',
        icon: 'time-outline'
      });
      await toast.present();
    } catch (error) {
      console.error('Error mostrando toast de lock timeout:', error);
    }
  }

  /**
   * Operador de reintento con delay exponencial
   */
  private retryWithBackoff<T>() {
    return (source: Observable<T>) => source.pipe(
      retry({
        count: this.maxRetries,
        delay: (error, retryCount) => {
          if (this.isConnectivityError(error) || this.isFirestoreIndexError(error) || this.isNavigatorLockError(error)) {
            const delay = this.retryDelay * Math.pow(2, retryCount - 1);
            console.log(`Reintentando en ${delay}ms (intento ${retryCount}/${this.maxRetries})`);
            this.showRetryToast(retryCount);
            return timer(delay);
          }
          return throwError(() => error);
        }
      })
    );
  }

  /**
   * Mostrar notificación de reintento
   */
  private async showRetryToast(retryCount: number) {
    try {
      const toast = await this.toastController.create({
        message: `Reintentando conexión... (${retryCount}/${this.maxRetries})`,
        duration: 2000,
        position: 'top',
        color: 'medium',
        icon: 'refresh-outline'
      });
      await toast.present();
    } catch (error) {
      console.error('Error mostrando toast de reintento:', error);
    }
  }

  /**
   * Ejecutar operación con reintentos automáticos
   */
  private executeWithRetry<T>(operation: () => Observable<T>): Observable<T> {
    return operation().pipe(
      this.retryWithBackoff(),
      catchError(this.handleFirestoreError<T>('operación con reintentos'))
    );
  }

  // Obtengo wallpapers con sistema de filtros avanzado
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

  // Obtengo un wallpaper por ID
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

  // Actualizo un wallpaper
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

  // Elimino un wallpaper
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

            // Eliminar la imagen de Firebase Storage
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

  // Busco wallpapers por título o descripción
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

  // Establezco wallpaper en la pantalla principal
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

  // Establezco wallpaper en la pantalla de bloqueo
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

  // Establezco wallpaper en ambas pantallas
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

  // Verifico permisos del plugin
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

  // Muestro toast con mensaje
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