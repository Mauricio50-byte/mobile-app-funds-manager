import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { Query } from '../services/query';
import { UserData, LoginCredentials, RegisterData } from '../interfaces';
import { FirebaseConfigService } from '../services/firebase-config.service';

@Injectable({
  providedIn: 'root'
})
export class AuthProvider {
  private currentUserSubject = new BehaviorSubject<UserData | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private auth: Auth,
    private query: Query,
    private firebaseConfig: FirebaseConfigService
  ) {
    // Escuchar cambios en el estado de autenticación
    this.auth.onAuthStateChanged(async (user: User | null) => {
      if (user) {
        try {
          const userData = await this.getUserData(user.uid);
          this.currentUserSubject.next(userData);
        } catch (error) {
          console.error('Error obteniendo datos del usuario en onAuthStateChanged:', error);
          // Si no se pueden obtener los datos de Firestore, crear un usuario básico
          const basicUserData: UserData = {
            uid: user.uid,
            name: user.displayName?.split(' ')[0] || 'Usuario',
            lastName: user.displayName?.split(' ')[1] || '',
            email: user.email || '',
            createdAt: new Date()
          };
          this.currentUserSubject.next(basicUserData);
        }
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): UserData | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Inicia sesión con email y contraseña
   */
  async login(credentials: LoginCredentials): Promise<UserData> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth, 
        credentials.email, 
        credentials.password
      );
      
      const userData = await this.getUserData(userCredential.user.uid);
      this.currentUserSubject.next(userData);
      
      return userData;
    } catch (error) {
      console.error('Error en login:', error);
      
      try {
        // Manejo específico de errores de autenticación
        if (this.isNetworkError(error)) {
          throw new Error('Sin conexión a internet. Verifica tu conexión e intenta nuevamente.');
        }
        
        if (this.isAuthError(error)) {
          throw new Error('Credenciales incorrectas. Verifica tu email y contraseña.');
        }
        
        throw new Error('Error al iniciar sesión. Intenta nuevamente.');
      } catch (handlingError) {
        console.error('Error manejando error de login:', handlingError);
        throw new Error('Error temporal. Intenta nuevamente.');
      }
    }
  }

  /**
   * Registra un nuevo usuario
   */
  async register(registerData: RegisterData): Promise<UserData> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth, 
        registerData.email, 
        registerData.password
      );

      const userData: UserData = {
        uid: userCredential.user.uid,
        name: registerData.name,
        lastName: registerData.lastName,
        email: registerData.email,
        createdAt: new Date()
      };

      // Guardar datos del usuario en Firestore
      await this.query.createDocument('users', userData.uid, userData);
      
      this.currentUserSubject.next(userData);
      return userData;
    } catch (error) {
      console.error('Error en registro:', error);
      
      try {
        // Manejo específico de errores de registro
        if (this.isNetworkError(error)) {
          throw new Error('Sin conexión a internet. Verifica tu conexión e intenta nuevamente.');
        }
        
        if (this.isEmailInUseError(error)) {
          throw new Error('Este email ya está registrado. Intenta con otro email.');
        }
        
        if (this.isWeakPasswordError(error)) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }
        
        throw new Error('Error al registrar usuario. Intenta nuevamente.');
      } catch (handlingError) {
        console.error('Error manejando error de registro:', handlingError);
        throw new Error('Error temporal. Intenta nuevamente.');
      }
    }
  }

  /**
   * Cierra sesión
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.currentUserSubject.next(null);
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  }

  /**
   * Obtiene los datos del usuario desde Firestore
   */
  private async getUserData(uid: string): Promise<UserData> {
    try {
      const userData = await this.query.getDocument('users', uid);
      return userData as UserData;
    } catch (error) {
      console.error('Error obteniendo datos del usuario:', error);
      
      try {
        // Manejo específico de errores de Firestore
        if (this.isNetworkError(error)) {
          // Devolver datos básicos del usuario si no hay conexión
          return {
            uid: uid,
            name: 'Usuario',
            lastName: '',
            email: '',
            createdAt: new Date()
          };
        }
        
        throw new Error('Error al obtener datos del usuario. Intenta nuevamente.');
      } catch (handlingError) {
        console.error('Error manejando error de getUserData:', handlingError);
        // Fallback: devolver datos básicos
        return {
          uid: uid,
          name: 'Usuario',
          lastName: '',
          email: '',
          createdAt: new Date()
        };
      }
    }
  }

  /**
   * Actualiza los datos del usuario
   */
  async updateUserData(userData: Partial<UserData>): Promise<void> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        throw new Error('No hay usuario autenticado');
      }

      const updatedData = {
        ...userData,
        updatedAt: new Date()
      };

      await this.query.updateDocument('users', currentUser.uid, updatedData);
      
      // Actualizar el usuario actual
      const updatedUser = { ...currentUser, ...updatedData };
      this.currentUserSubject.next(updatedUser);
    } catch (error) {
      console.error('Error actualizando datos del usuario:', error);
      throw error;
    }
  }

  /**
   * Verificar si es un error de red
   */
  private isNetworkError(error: any): boolean {
    const networkErrors = [
      'network-request-failed',
      'ERR_NETWORK',
      'ERR_ABORTED',
      'ERR_CONNECTION_REFUSED',
      'offline',
      'timeout'
    ];
    
    const errorMessage = error?.message || error?.code || error?.toString() || '';
    return networkErrors.some(msg => errorMessage.includes(msg));
  }

  /**
   * Verificar si es un error de autenticación
   */
  private isAuthError(error: any): boolean {
    const authErrors = [
      'auth/user-not-found',
      'auth/wrong-password',
      'auth/invalid-email',
      'auth/invalid-credential'
    ];
    
    const errorCode = error?.code || '';
    return authErrors.some(code => errorCode.includes(code));
  }

  /**
   * Verificar si es un error de email ya en uso
   */
  private isEmailInUseError(error: any): boolean {
    return error?.code === 'auth/email-already-in-use';
  }

  /**
   * Verificar si es un error de contraseña débil
   */
  private isWeakPasswordError(error: any): boolean {
    return error?.code === 'auth/weak-password';
  }

  /**
   * Verificar si es un error específico de Google Auth
   */
  private isGoogleAuthError(error: any): boolean {
    const googleAuthErrors = [
      'auth/cancelled-popup-request',
      'auth/popup-closed-by-user',
      'auth/unauthorized-domain',
      'auth/operation-not-allowed'
    ];
    
    const errorCode = error?.code || '';
    return googleAuthErrors.some(code => errorCode.includes(code));
  }

  /**
   * Verificar si es un error de popup bloqueado
   */
  private isPopupBlockedError(error: any): boolean {
    const popupErrors = [
      'auth/popup-blocked',
      'popup-blocked',
      'blocked',
      'popup was blocked'
    ];
    
    const errorMessage = error?.message || error?.code || error?.toString() || '';
    return popupErrors.some(msg => errorMessage.toLowerCase().includes(msg.toLowerCase()));
  }

  /**
   * Inicia sesión con Google
   */
  async loginWithGoogle(): Promise<UserData> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile'),
      provider.addScope('email');
      
      const result = await signInWithPopup(this.auth, provider);
      
      if (!result.user) {
        throw new Error('No se pudo obtener información del usuario de Google');
      }

      // Verificar si el usuario ya existe en Firestore
      let userData: UserData;
      try {
        userData = await this.getUserData(result.user.uid);
      } catch (error) {
        // Usuario nuevo, crear documento en Firestore
        try {
          if (!result.user.email) {
            throw new Error('No se pudo obtener el email del usuario de Google');
          }

          userData = {
            uid: result.user.uid,
            name: result.user.displayName?.split(' ')[0] || 'Usuario',
            lastName: result.user.displayName?.split(' ').slice(1).join(' ') || 'Google',
            email: result.user.email,
            createdAt: new Date()
          };

          await this.query.createDocument('users', userData.uid, userData);
        } catch (createError) {
          console.error('Error creando usuario en Firestore:', createError);
          // Fallback: crear datos básicos del usuario sin guardar en Firestore
          userData = {
            uid: result.user.uid,
            name: result.user.displayName?.split(' ')[0] || 'Usuario',
            lastName: result.user.displayName?.split(' ').slice(1).join(' ') || 'Google',
            email: result.user.email || 'email@google.com',
            createdAt: new Date()
          };
        }
      }
      
      this.currentUserSubject.next(userData);
      return userData;
    } catch (error) {
      console.error('Error en loginWithGoogle:', error);
      
      try {
        // Manejo específico de errores de Google Auth
        if (this.isNetworkError(error)) {
          throw new Error('Sin conexión a internet. Verifica tu conexión e intenta nuevamente.');
        }
        
        if (this.isGoogleAuthError(error)) {
          throw new Error('Error de autenticación con Google. Intenta nuevamente.');
        }
        
        if (this.isPopupBlockedError(error)) {
          throw new Error('Popup bloqueado. Permite popups para este sitio e intenta nuevamente.');
        }
        
        throw new Error('Error al iniciar sesión con Google. Intenta nuevamente.');
      } catch (handlingError) {
        console.error('Error manejando error de loginWithGoogle:', handlingError);
        throw new Error('Error temporal con Google. Intenta nuevamente.');
      }
    }
  }
}