import { Injectable, inject } from '@angular/core';
import { Auth as FirebaseAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User, updateProfile, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { authState } from '@angular/fire/auth';
import { Query } from './query';
import { UserData } from '../interfaces';

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
      
      // Verificar y reparar datos de usuario si es necesario
      await this.verifyAndRepairUserData();
      
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
        console.log('Usuario autenticado con Google:', {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        });

        try {
          const userDoc = await this.queryService.getDocument('users', result.user.uid);
          console.log('Documento de usuario existente:', userDoc);
          
          if (!userDoc) {
            // Es un nuevo usuario, guardar sus datos
            if (!result.user.email) {
              throw new Error('No se pudo obtener el email del usuario de Google');
            }

            const userData: UserData = {
              name: result.user.displayName?.split(' ')[0] || 'Usuario',
              lastName: result.user.displayName?.split(' ').slice(1).join(' ') || 'Google',
              email: result.user.email,
              uid: result.user.uid,
              createdAt: new Date()
            };

            console.log('Creando nuevo documento de usuario:', userData);
            await this.queryService.createDocument('users', result.user.uid, userData);
            console.log('Documento de usuario creado exitosamente');
          } else {
            // Usuario existente, verificar y actualizar email si es necesario
            if (!userDoc.email && result.user.email) {
              console.log('Actualizando email faltante para usuario existente');
              await this.queryService.updateDocument('users', result.user.uid, {
                email: result.user.email
              });
            }
          }
        } catch (firestoreError: any) {
          console.error('Error al acceder a Firestore:', firestoreError);
          
          // Si es un error de conectividad, mostrar mensaje específico
          if (this.isFirestoreConnectivityError(firestoreError)) {
            console.warn('Error de conectividad con Firestore. El usuario se autenticó pero no se pudo guardar en la base de datos.');
            // Continuar con el login aunque falle la creación del documento
          } else {
            console.error('Error inesperado al guardar datos del usuario:', firestoreError);
            // Para otros errores, también continuar pero registrar el error
          }
        }
      }
      
      return result;
    } catch (error: any) {
      console.error('Error en loginWithGoogle:', error);
      
      // Manejo específico de errores comunes
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('El popup de Google fue cerrado. Por favor, intenta nuevamente.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('El popup fue bloqueado por el navegador. Por favor, permite popups para este sitio.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Solicitud de popup cancelada. Solo se permite un popup a la vez.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Error de conexión. Verifica tu conexión a internet e intenta nuevamente.');
      } else if (this.isFirestoreConnectivityError(error)) {
        throw new Error('Error de conectividad con la base de datos. Verifica tu conexión e intenta nuevamente.');
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

  // Verificar si el error es de conectividad de Firestore
  private isFirestoreConnectivityError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code?.toLowerCase() || '';
    
    return errorMessage.includes('network') || 
          errorMessage.includes('offline') || 
          errorMessage.includes('connection') ||
          errorMessage.includes('aborted') ||
          errorMessage.includes('err_aborted') ||
          errorCode.includes('unavailable') ||
          errorCode.includes('deadline-exceeded') ||
          errorCode.includes('network-error') ||
          errorCode.includes('permission-denied');
  }

  // Método para verificar y reparar datos de usuario faltantes
  async verifyAndRepairUserData(): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return;

    try {
      const userDoc = await this.queryService.getDocument('users', currentUser.uid);
      
      if (userDoc && !userDoc.email && currentUser.email) {
        console.log('Reparando email faltante para usuario:', currentUser.uid);
        await this.queryService.updateDocument('users', currentUser.uid, {
          email: currentUser.email
        });
        console.log('Email reparado exitosamente');
      }
    } catch (error) {
      console.error('Error al verificar/reparar datos de usuario:', error);
    }
  }
}
