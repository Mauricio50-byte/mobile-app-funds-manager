import { Injectable } from '@angular/core';
import { Auth as FirebaseAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { authState } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  public user$: Observable<User | null>;

  constructor(private firebaseAuth: FirebaseAuth) {
    this.user$ = authState(this.firebaseAuth);
  }

  // Método para registrar usuario
  async register(email: string, password: string): Promise<any> {
    try {
      const result = await createUserWithEmailAndPassword(this.firebaseAuth, email, password);
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
