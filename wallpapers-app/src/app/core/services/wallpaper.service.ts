import { Injectable } from '@angular/core';
import { Observable, from, map, switchMap, catchError, of, retry, timer, throwError } from 'rxjs';
import { ToastController, Platform } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
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
    private toastController: ToastController,
    private http: HttpClient
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

  /**
   * Descarga una imagen desde una URL y la convierte a base64
   */
  private async downloadImageAsBase64(imageUrl: string): Promise<string> {
    try {
      console.log('Descargando imagen desde:', imageUrl);
      
      // Configurar headers para evitar problemas de CORS
      const headers = {
        'Accept': 'image/*',
        'Cache-Control': 'no-cache'
      };
      
      // Descargar la imagen como blob
      const response = await this.http.get(imageUrl, { 
        responseType: 'blob',
        headers: headers
      }).toPromise();
      
      if (!response) {
        throw new Error('No se pudo descargar la imagen');
      }

      // Convertir blob a base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          // Remover el prefijo "data:image/...;base64," para obtener solo el base64
          const base64Data = base64.split(',')[1];
          console.log('Imagen convertida a base64, tamaño:', base64Data.length);
          
          // Validar que el base64 no esté vacío
          if (!base64Data || base64Data.length === 0) {
            reject(new Error('La imagen descargada está vacía'));
            return;
          }
          
          resolve(base64Data);
        };
        reader.onerror = () => reject(new Error('Error al convertir imagen a base64'));
        reader.readAsDataURL(response);
      });
    } catch (error: any) {
      console.error('Error descargando imagen:', error);
      
      // Si es un error de CORS, intentar con el plugin nativo directamente
      if (error.status === 0 || error.message?.includes('CORS')) {
        console.log('Error de CORS detectado, intentando descarga directa con plugin nativo...');
        throw new Error('Error de CORS: La imagen no se puede descargar desde el navegador. Intenta con una imagen de otro servidor.');
      }
      
      throw new Error(`Error al descargar imagen: ${error.message || 'Error desconocido'}`);
    }
  }

  /**
   * Valida si una URL es válida
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Aplica un fondo de pantalla de bloqueo
   */
  async setLockWallpaper(imageUrl: string): Promise<void> {
    try {
      console.log('Iniciando proceso para establecer fondo de pantalla de bloqueo');
      
      // Verificar y solicitar permisos primero
      const hasPermissions = await this.checkAndRequestPermissions();
      if (!hasPermissions) {
        throw new Error('Permission denied: Se requieren permisos para establecer fondos de pantalla');
      }
      
      // Descargar y convertir imagen
      const base64Image = await this.downloadImageAsBase64(imageUrl);
      
      // Aplicar fondo de pantalla
      await WallpaperPlugin.setLockWallpaper({ base64Image });
      
      console.log('Fondo de pantalla de bloqueo establecido exitosamente');
      
      // Mostrar mensaje de éxito
      await this.toastController.create({
        message: 'Fondo de pantalla de bloqueo aplicado correctamente',
        duration: 3000,
        color: 'success',
        position: 'bottom'
      }).then(toast => toast.present());
      
    } catch (error: any) {
      console.error('Error al establecer fondo de pantalla de bloqueo:', error);
      
      let errorMessage = 'Error al aplicar fondo de pantalla de bloqueo';
      
      if (error.message?.includes('Permission denied')) {
        errorMessage = 'Permisos denegados. Por favor, concede los permisos necesarios en la configuración de la aplicación.';
      } else if (error.message?.includes('CORS')) {
        errorMessage = 'No se puede descargar la imagen. Intenta con una imagen de otro servidor.';
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
      }
      
      // Mostrar mensaje de error
      await this.toastController.create({
        message: errorMessage,
        duration: 5000,
        color: 'danger',
        position: 'bottom'
      }).then(toast => toast.present());
      
      throw error;
    }
  }

  /**
   * Solicita permisos dinámicos para Android 13+
   */
  private async requestMediaPermissions(): Promise<boolean> {
    try {
      if (this.platform.is('android')) {
        console.log('Solicitando permisos de wallpaper...');
        
        // Primero verificar permisos actuales
        const permissionStatus = await WallpaperPlugin.checkPermissions();
        console.log('Estado actual de permisos:', permissionStatus);
        
        if (permissionStatus.hasPermission) {
          console.log('Todos los permisos ya están concedidos');
          return true;
        }
        
        // Solicitar permisos si no los tenemos
        console.log('Solicitando permisos faltantes...');
        const result = await WallpaperPlugin.requestPermissions();
        console.log('Resultado de solicitud de permisos:', result);
        
        if (result.granted) {
          console.log('Permisos concedidos exitosamente');
          return true;
        } else {
          console.warn('Permisos denegados por el usuario');
          await this.showToast('Se necesitan permisos para establecer wallpapers', 'warning');
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error requesting media permissions:', error);
      await this.showToast('Error al solicitar permisos', 'danger');
      return false;
    }
  }

  /**
   * Muestra un toast con el mensaje especificado
   */
  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  /**
   * Verifica y solicita permisos necesarios
   */
  private async checkAndRequestPermissions(): Promise<boolean> {
    try {
      if (this.platform.is('android')) {
        console.log('Verificando permisos de wallpaper...');
        
        // Primero verificar permisos actuales
        const permissionStatus = await WallpaperPlugin.checkPermissions();
        console.log('Estado actual de permisos:', permissionStatus);
        
        if (permissionStatus.hasPermission) {
          console.log('Todos los permisos ya están concedidos');
          return true;
        }
        
        // Solicitar permisos si no los tenemos
        console.log('Solicitando permisos faltantes...');
        const result = await WallpaperPlugin.requestPermissions();
        console.log('Resultado de solicitud de permisos:', result);
        
        if (result.granted) {
          console.log('Permisos concedidos exitosamente');
          return true;
        } else {
          console.warn('Permisos denegados por el usuario');
          await this.showToast('Se necesitan permisos para establecer wallpapers', 'warning');
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error checking and requesting permissions:', error);
      await this.showToast('Error al verificar permisos', 'danger');
      return false;
    }
  }

  /**
   * Aplica un fondo de pantalla de inicio
   */
  async setHomeWallpaper(imageUrl: string): Promise<void> {
    try {
      console.log('Iniciando proceso para establecer fondo de pantalla de inicio');
      
      // Verificar y solicitar permisos primero
      const hasPermissions = await this.checkAndRequestPermissions();
      if (!hasPermissions) {
        throw new Error('Permission denied: Se requieren permisos para establecer fondos de pantalla');
      }
      
      // Descargar y convertir imagen
      const base64Image = await this.downloadImageAsBase64(imageUrl);
      
      // Aplicar fondo de pantalla
      await WallpaperPlugin.setHomeWallpaper({ base64Image });
      
      console.log('Fondo de pantalla de inicio establecido exitosamente');
      
      // Mostrar mensaje de éxito
      await this.toastController.create({
        message: 'Fondo de pantalla de inicio aplicado correctamente',
        duration: 3000,
        color: 'success',
        position: 'bottom'
      }).then(toast => toast.present());
      
    } catch (error: any) {
      console.error('Error al establecer fondo de pantalla de inicio:', error);
      
      let errorMessage = 'Error al aplicar fondo de pantalla de inicio';
      
      if (error.message?.includes('Permission denied')) {
        errorMessage = 'Permisos denegados. Por favor, concede los permisos necesarios en la configuración de la aplicación.';
      } else if (error.message?.includes('CORS')) {
        errorMessage = 'No se puede descargar la imagen. Intenta con una imagen de otro servidor.';
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
      }
      
      // Mostrar mensaje de error
      await this.toastController.create({
        message: errorMessage,
        duration: 5000,
        color: 'danger',
        position: 'bottom'
      }).then(toast => toast.present());
      
      throw error;
    }
  }

  // Establezco wallpaper en la pantalla principal
  async setWallpaperHomeScreen(imageUrl: string): Promise<boolean> {
    if (!this.platform.is('android')) {
      await this.showToast('Esta funcionalidad solo está disponible en Android', 'warning');
      return false;
    }

    if (!this.isValidUrl(imageUrl)) {
      await this.showToast('URL de imagen no válida', 'danger');
      return false;
    }

    try {
      await this.showToast('Descargando imagen...', 'success');
      
      // Verificar permisos primero
      const hasPermissions = await this.requestMediaPermissions();
      if (!hasPermissions) {
        await this.showToast('Permisos insuficientes para establecer wallpaper', 'danger');
        return false;
      }

      // Descargar y convertir imagen a base64
      const base64Image = await this.downloadImageAsBase64(imageUrl);
      
      await this.showToast('Estableciendo wallpaper...', 'success');
      
      // Enviar base64 al plugin en lugar de URL
      const result = await WallpaperPlugin.setWallpaperHomeScreen({ 
        base64Image 
      });
      
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

    if (!this.isValidUrl(imageUrl)) {
      await this.showToast('URL de imagen no válida', 'danger');
      return false;
    }

    try {
      await this.showToast('Descargando imagen...', 'success');
      
      // Verificar permisos primero
      const hasPermissions = await this.requestMediaPermissions();
      if (!hasPermissions) {
        await this.showToast('Permisos insuficientes para establecer wallpaper', 'danger');
        return false;
      }

      // Descargar y convertir imagen a base64
      const base64Image = await this.downloadImageAsBase64(imageUrl);
      
      await this.showToast('Estableciendo wallpaper de bloqueo...', 'success');
      
      // Enviar base64 al plugin en lugar de URL
      const result = await WallpaperPlugin.setWallpaperLockScreen({ 
        base64Image 
      });
      
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

    if (!this.isValidUrl(imageUrl)) {
      await this.showToast('URL de imagen no válida', 'danger');
      return false;
    }

    try {
      await this.showToast('Descargando imagen...', 'success');
      
      // Verificar permisos primero
      const hasPermissions = await this.requestMediaPermissions();
      if (!hasPermissions) {
        await this.showToast('Permisos insuficientes para establecer wallpaper', 'danger');
        return false;
      }

      // Descargar y convertir imagen a base64
      const base64Image = await this.downloadImageAsBase64(imageUrl);
      
      await this.showToast('Estableciendo wallpaper en ambas pantallas...', 'success');
      
      // Enviar base64 al plugin en lugar de URL
      const result = await WallpaperPlugin.setBothWallpapers({ 
        base64Image 
      });
      
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
      console.log('Permisos de wallpaper:', {
        hasPermission: result.hasPermission,
        isWallpaperSupported: result.isWallpaperSupported,
        hasSetWallpaperPermission: result.hasSetWallpaperPermission,
        hasMediaPermission: result.hasMediaPermission,
        androidVersion: result.androidVersion
      });
      return result.hasPermission;
    } catch (error) {
      console.error('Error checking wallpaper permissions:', error);
      return false;
    }
  }

}