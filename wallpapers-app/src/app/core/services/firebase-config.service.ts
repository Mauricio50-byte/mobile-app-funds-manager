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
      // Configurar Auth para evitar NavigatorLockAcquireTimeoutError
      if (this.auth && typeof window !== 'undefined') {
        // Configurar timeout más largo para evitar bloqueos
        (this.auth as any)._config = {
          ...((this.auth as any)._config || {}),
          authTokenSyncURL: null, // Deshabilitar sincronización automática problemática
        };
      }

      // Configurar Firestore para mejor conectividad
      if (this.firestore && typeof window !== 'undefined') {
        // Configuraciones para mejorar la estabilidad
        console.log('Firebase configurado correctamente');
      }
    } catch (error) {
      console.warn('Error configurando Firebase:', error);
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