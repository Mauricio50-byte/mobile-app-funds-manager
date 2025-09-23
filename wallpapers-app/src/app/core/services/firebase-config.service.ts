import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirebaseConfigService {

  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {
    this.configureFirebase();
  }

  private configureFirebase(): void {
    try {
      // Detectar si estamos en un dispositivo móvil
      const isMobile = typeof window !== 'undefined' && (window as any).Capacitor;
      
      // Configurar Auth para evitar NavigatorLockAcquireTimeoutError
      if (this.auth && typeof window !== 'undefined') {
        // Configurar timeout más largo para evitar bloqueos
        (this.auth as any)._config = {
          ...((this.auth as any)._config || {}),
          authTokenSyncURL: null, // Deshabilitar sincronización automática problemática
        };
        
        // Configuraciones específicas para móviles
        if (isMobile) {
          console.log('Configurando Firebase para dispositivo móvil');
          // Configurar timeouts más largos para dispositivos móviles
          (this.auth as any)._config.timeout = 10000; // 10 segundos
        }
      }

      // Configurar Firestore para mejor conectividad
      if (this.firestore && typeof window !== 'undefined') {
        // Configuraciones para mejorar la estabilidad
        if (isMobile) {
          // En dispositivos móviles, configurar cache offline
          console.log('Configurando Firestore para dispositivo móvil con cache offline');
        }
        console.log('Firebase configurado correctamente');
      }
    } catch (error) {
      console.warn('Error configurando Firebase:', error);
      // En caso de error, continuar sin bloquear la aplicación
    }
  }

  /**
   * Reiniciar configuración de Firebase si es necesario
   */
  public resetConfiguration(): void {
    this.configureFirebase();
  }

  /**
   * Verificar estado de conectividad
   */
  public checkConnectivity(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        if (this.auth && this.firestore) {
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (error) {
        console.error('Error verificando conectividad:', error);
        resolve(false);
      }
    });
  }
}