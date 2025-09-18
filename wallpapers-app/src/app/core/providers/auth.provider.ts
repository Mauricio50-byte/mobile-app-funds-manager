import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { Query } from '../services/query';
import { UserData, LoginCredentials, RegisterData } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthProvider {
  private currentUserSubject = new BehaviorSubject<UserData | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private auth: Auth,
    private query: Query
  ) {
    // Escuchar cambios en el estado de autenticación
    this.auth.onAuthStateChanged(async (user: User | null) => {
      if (user) {
        const userData = await this.getUserData(user.uid);
        this.currentUserSubject.next(userData);
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
      throw error;
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
      throw error;
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
      throw error;
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
}