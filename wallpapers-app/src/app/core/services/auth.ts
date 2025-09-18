import { Injectable, inject } from '@angular/core';
import { Auth as FirebaseAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User, updateProfile, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { authState } from '@angular/fire/auth';
import { Query } from './query';

export interface UserData {
  name: string;
  lastName: string;
  email: string;
  uid: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private firebaseAuth = inject(FirebaseAuth);
  private queryService = inject(Query);
  public user$: Observable<User | null>;

  constructor() {
    this.user$ = authState(this.firebaseAuth);
  }

  // Método para registrar usuario
  async register(email: string, password: string, additionalData?: { name: string; lastName: string }): Promise<any> {
    try {
      const result = await createUserWithEmailAndPassword(this.firebaseAuth, email, password);
      
      if (result.user && additionalData) {
        // Actualizar el perfil del usuario en Firebase Auth
        await updateProfile(result.user, {
          displayName: `${additionalData.name} ${additionalData.lastName}`
        });

        // Guardar datos adicionales en Firestore
        const userData: UserData = {
          name: additionalData.name,
          lastName: additionalData.lastName,
          email: email,
          uid: result.user.uid,
          createdAt: new Date()
        };

        await this.queryService.createDocument('users', result.user.uid, userData);
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Método para iniciar sesión
  async login(email: string, password: string): Promise<any> {
    try {
      const result = await signInWithEmailAndPassword(this.firebaseAuth, email, password);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Método para iniciar sesión con Google
  async loginWithGoogle(): Promise<any> {
    try {
      const provider = new GoogleAuthProvider();
      // Configurar scopes adicionales si es necesario
      provider.addScope('profile');
      provider.addScope('email');
      
      const result = await signInWithPopup(this.firebaseAuth, provider);
      
      // Si es la primera vez que el usuario se registra con Google, guardar sus datos
      if (result.user) {
        try {
          const userDoc = await this.queryService.getDocument('users', result.user.uid);
          
          if (!userDoc) {
            // Es un nuevo usuario, guardar sus datos
            const userData: UserData = {
              name: result.user.displayName?.split(' ')[0] || 'Usuario',
              lastName: result.user.displayName?.split(' ').slice(1).join(' ') || 'Google',
              email: result.user.email || '',
              uid: result.user.uid,
              createdAt: new Date()
            };

            await this.queryService.createDocument('users', result.user.uid, userData);
          }
        } catch (firestoreError: any) {
          console.warn('Error al acceder a Firestore:', firestoreError);
          // Continuar con el login aunque falle la creación del documento
          // El usuario puede usar la app pero sin datos adicionales en Firestore
        }
      }
      
      return result;
    } catch (error: any) {
      console.error('Error en Google Auth:', error);
      
      // Manejo específico de errores
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('El popup fue cerrado por el usuario');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('El popup fue bloqueado por el navegador');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Solicitud de popup cancelada');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('Dominio no autorizado para autenticación');
      } else if (error.message?.includes('Missing or insufficient permissions')) {
        throw new Error('Permisos insuficientes. Verifica la configuración de Firestore');
      } else {
        throw new Error(`Error de autenticación: ${error.message || 'Error desconocido'}`);
      }
    }
  }

  // Método para cerrar sesión
  async logout(): Promise<void> {
    try {
      await signOut(this.firebaseAuth);
    } catch (error) {
      throw error;
    }
  }

  // Obtener usuario actual
  getCurrentUser(): User | null {
    return this.firebaseAuth.currentUser;
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return !!this.firebaseAuth.currentUser;
  }
}
