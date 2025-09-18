import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Language = 'es' | 'en';

export interface Translations {
  [key: string]: string | Translations;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguageSubject = new BehaviorSubject<Language>('es');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  private translations: { [key in Language]: Translations } = {
    es: {},
    en: {}
  };

  constructor() {
    this.loadTranslations();
    // Cargar idioma guardado o detectar idioma del navegador
    const savedLanguage = localStorage.getItem('app-language') as Language;
    if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'en')) {
      this.setLanguage(savedLanguage);
    } else {
      // Detectar idioma del navegador
      const browserLang = navigator.language.substring(0, 2) as Language;
      this.setLanguage(browserLang === 'es' ? 'es' : 'en');
    }
  }

  private loadTranslations(): void {
    // Traducciones en español
    this.translations.es = {
      // Comunes
      common: {
        email: 'Correo electrónico',
        password: 'Contraseña',
        confirmPassword: 'Confirmar contraseña',
        name: 'Nombre',
        lastName: 'Apellido',
        login: 'Iniciar sesión',
        register: 'Registrarse',
        cancel: 'Cancelar',
        accept: 'Aceptar',
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito'
      },
      // Login
      login: {
        title: 'Iniciar Sesión',
        subtitle: 'Ingresa tus credenciales',
        emailPlaceholder: 'Ingresa tu correo',
        passwordPlaceholder: 'Ingresa tu contraseña',
        loginButton: 'Iniciar Sesión',
        registerLink: 'Regístrate aquí',
        noAccount: '¿No tienes cuenta?',
        forgotPassword: '¿Olvidaste tu contraseña?',
        or: 'o',
        googleButton: 'Iniciar sesión con Google'
      },
      // Register
      register: {
        title: 'Crear Cuenta',
        subtitle: 'Completa tus datos',
        namePlaceholder: 'Ingresa tu nombre',
        lastNamePlaceholder: 'Ingresa tu apellido',
        emailPlaceholder: 'Ingresa tu correo',
        passwordPlaceholder: 'Crea una contraseña',
        confirmPasswordPlaceholder: 'Confirma tu contraseña',
        registerButton: 'Crear Cuenta',
        loginLink: 'Inicia sesión aquí',
        hasAccount: '¿Ya tienes cuenta?',
        termsAccept: 'Acepto los términos y condiciones',
        or: 'o',
        googleButton: 'Registrarse con Google'
      },
      // Validaciones
      validation: {
        required: 'Este campo es requerido',
        email: 'Ingresa un correo válido',
        minLength: 'Mínimo {0} caracteres',
        passwordMismatch: 'Las contraseñas no coinciden',
        invalidCredentials: 'Credenciales inválidas',
        emailExists: 'El correo ya está registrado',
        weakPassword: 'La contraseña es muy débil'
      },
      // Mensajes
      messages: {
        loginSuccess: 'Inicio de sesión exitoso',
        registerSuccess: 'Cuenta creada exitosamente',
        logoutSuccess: 'Sesión cerrada',
        loginError: 'Error al iniciar sesión',
        registerError: 'Error al crear cuenta'
      }
    };

    // Traducciones en inglés
    this.translations.en = {
      // Common
      common: {
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        name: 'Name',
        lastName: 'Last Name',
        login: 'Login',
        register: 'Register',
        cancel: 'Cancel',
        accept: 'Accept',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success'
      },
      // Login
      login: {
        title: 'Sign In',
        subtitle: 'Enter your credentials',
        emailPlaceholder: 'Enter your email',
        passwordPlaceholder: 'Enter your password',
        loginButton: 'Sign In',
        registerLink: 'Register here',
        noAccount: "Don't have an account?",
        forgotPassword: 'Forgot your password?',
        or: 'or',
        googleButton: 'Sign in with Google'
      },
      // Register
      register: {
        title: 'Create Account',
        subtitle: 'Complete your information',
        namePlaceholder: 'Enter your name',
        lastNamePlaceholder: 'Enter your last name',
        emailPlaceholder: 'Enter your email',
        passwordPlaceholder: 'Create a password',
        confirmPasswordPlaceholder: 'Confirm your password',
        registerButton: 'Create Account',
        loginLink: 'Sign in here',
        hasAccount: 'Already have an account?',
        termsAccept: 'I accept the terms and conditions',
        or: 'or',
        googleButton: 'Sign up with Google'
      },
      // Validations
      validation: {
        required: 'This field is required',
        email: 'Enter a valid email',
        minLength: 'Minimum {0} characters',
        passwordMismatch: 'Passwords do not match',
        invalidCredentials: 'Invalid credentials',
        emailExists: 'Email already registered',
        weakPassword: 'Password is too weak'
      },
      // Messages
      messages: {
        loginSuccess: 'Login successful',
        registerSuccess: 'Account created successfully',
        logoutSuccess: 'Logged out',
        loginError: 'Login error',
        registerError: 'Error creating account'
      }
    };
  }

  setLanguage(language: Language): void {
    this.currentLanguageSubject.next(language);
    localStorage.setItem('app-language', language);
  }

  getCurrentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }

  translate(key: string, params?: string[]): string {
    const currentLang = this.getCurrentLanguage();
    const translation = this.getNestedTranslation(this.translations[currentLang], key);
    
    if (typeof translation === 'string') {
      return this.interpolateParams(translation, params);
    }
    
    return key; // Retorna la clave si no encuentra traducción
  }

  private getNestedTranslation(obj: Translations, key: string): string | Translations {
    const keys = key.split('.');
    let current: any = obj;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return key;
      }
    }
    
    return current;
  }

  private interpolateParams(text: string, params?: string[]): string {
    if (!params) return text;
    
    return text.replace(/\{(\d+)\}/g, (match, index) => {
      const paramIndex = parseInt(index, 10);
      return params[paramIndex] !== undefined ? params[paramIndex] : match;
    });
  }

  // Método helper para obtener traducciones reactivas
  getTranslation$(key: string, params?: string[]): Observable<string> {
    return new Observable(observer => {
      const subscription = this.currentLanguage$.subscribe(() => {
        observer.next(this.translate(key, params));
      });
      
      return () => subscription.unsubscribe();
    });
  }
}