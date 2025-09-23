import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

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
  private languageSubject = new BehaviorSubject<Language>('es');
  public language$ = this.languageSubject.asObservable();
  
  private currentLanguage: Language = 'es';
  private supportedLanguages: Language[] = ['es', 'en'];
  private translationsLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  private translations: { [key in Language]: Translations } = {
    es: {},
    en: {}
  };

  constructor(private http: HttpClient) {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Detectar idioma del navegador primero
    const browserLang = navigator.language.split('-')[0] as Language;
    this.currentLanguage = this.supportedLanguages.includes(browserLang) ? browserLang : 'es';
    
    // Cargar idioma guardado
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && this.supportedLanguages.includes(savedLang)) {
      this.currentLanguage = savedLang;
    }

    // Emitir el idioma inmediatamente para que la UI no se bloquee
    this.languageSubject.next(this.currentLanguage);
    this.currentLanguageSubject.next(this.currentLanguage);

    // Cargar traducciones de forma asíncrona sin bloquear la UI
    this.loadingPromise = this.loadTranslations();
    
    // En dispositivos móviles, no esperar las traducciones para continuar
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      // Marcar como cargado inmediatamente en móviles para evitar bloqueos
      this.translationsLoaded = true;
      // Cargar traducciones en background
      this.loadingPromise.catch(error => {
        console.warn('Background translation loading failed:', error);
      });
    } else {
      // En web, esperar las traducciones
      try {
        await this.loadingPromise;
        this.translationsLoaded = true;
      } catch (error) {
        console.error('Translation loading failed:', error);
        this.translationsLoaded = true; // Marcar como cargado para continuar
      }
    }
  }

  private async loadTranslations(): Promise<void> {
    try {
      console.log('Loading translations...');
      
      // Timeout más corto para dispositivos móviles
      const isMobile = typeof window !== 'undefined' && (window as any).Capacitor;
      const timeout = isMobile ? 2000 : 5000; // 2 segundos en móvil, 5 en web
      
      const esRequest = lastValueFrom(this.http.get<Translations>('assets/i18n/es.json'));
      const enRequest = lastValueFrom(this.http.get<Translations>('assets/i18n/en.json'));
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Translation loading timeout')), timeout);
      });
      
      const [esTranslations, enTranslations] = await Promise.race([
        Promise.all([esRequest, enRequest]),
        timeoutPromise
      ]);

      // Verificar que las traducciones se cargaron correctamente
      if (esTranslations && Object.keys(esTranslations).length > 0 && 
          enTranslations && Object.keys(enTranslations).length > 0) {
        this.translations.es = esTranslations;
        this.translations.en = enTranslations;
        console.log('Translations loaded successfully:', { 
          es: Object.keys(esTranslations).length, 
          en: Object.keys(enTranslations).length 
        });
        
        // Actualizar el estado de carga después de cargar exitosamente
        if (!this.translationsLoaded) {
          this.translationsLoaded = true;
        }
      } else {
        throw new Error('Empty translation files');
      }
    } catch (error) {
      console.error('Error loading translations:', error);
      this.setFallbackTranslations();
    }
  }

  private setFallbackTranslations(): void {
    // Fallback a traducciones básicas si falla la carga
    this.translations.es = {
      common: { 
        loading: 'Cargando...', 
        error: 'Error',
        success: 'Éxito',
        cancel: 'Cancelar',
        accept: 'Aceptar',
        email: 'Correo Electrónico',
        password: 'Contraseña',
        name: 'Nombre',
        lastName: 'Apellido'
      },
      login: {
        title: 'Iniciar Sesión',
        subtitle: 'Inicia sesión para acceder a tus fondos',
        loginButton: 'Iniciar Sesión',
        noAccount: '¿No tienes cuenta?',
        registerLink: 'Regístrate aquí'
      },
      register: {
        title: 'Registro',
        subtitle: 'Crea tu cuenta para comenzar',
        registerButton: 'Registrarse',
        hasAccount: '¿Ya tienes cuenta?',
        loginLink: 'Inicia sesión aquí'
      },
      home: { title: 'Inicio' },
      validation: {
        required: 'Este campo es requerido',
        email: 'Ingresa un correo electrónico válido'
      }
    };
    this.translations.en = {
      common: { 
        loading: 'Loading...', 
        error: 'Error',
        success: 'Success',
        cancel: 'Cancel',
        accept: 'Accept',
        email: 'Email',
        password: 'Password',
        name: 'Name',
        lastName: 'Last Name'
      },
      login: {
        title: 'Sign In',
        subtitle: 'Sign in to access your wallpapers',
        loginButton: 'Sign In',
        noAccount: "Don't have an account?",
        registerLink: 'Register here'
      },
      register: {
        title: 'Register',
        subtitle: 'Create your account to get started',
        registerButton: 'Register',
        hasAccount: 'Already have an account?',
        loginLink: 'Sign in here'
      },
      home: { title: 'Home' },
      validation: {
        required: 'This field is required',
        email: 'Enter a valid email address'
      }
    };
    
    console.warn('Using fallback translations');
  }

  setLanguage(language: Language): void {
    this.currentLanguage = language;
    this.currentLanguageSubject.next(language);
    this.languageSubject.next(language);
    localStorage.setItem('language', language);
  }

  getCurrentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }

  isLoaded(): boolean {
    return this.translationsLoaded;
  }

  async waitForTranslations(): Promise<void> {
    if (this.translationsLoaded) {
      return;
    }
    
    // En dispositivos móviles, no esperar las traducciones para evitar bloqueos
    const isMobile = typeof window !== 'undefined' && (window as any).Capacitor;
    if (isMobile) {
      console.log('Mobile device detected, skipping translation wait');
      this.translationsLoaded = true;
      return;
    }
    
    // Timeout más corto para web
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        console.warn('Translation loading timeout, continuing with fallbacks');
        this.translationsLoaded = true; // Marcar como cargado para evitar más bloqueos
        resolve();
      }, 3000); // 3 segundos de timeout para web
    });
    
    if (this.loadingPromise) {
      try {
        await Promise.race([this.loadingPromise, timeoutPromise]);
      } catch (error) {
        console.error('Error loading translations:', error);
        this.setFallbackTranslations();
        this.translationsLoaded = true; // Marcar como cargado para continuar
      }
    } else {
      // Si no hay promesa de carga, marcar como cargado inmediatamente
      this.translationsLoaded = true;
    }
  }

  translate(key: string, params?: string[]): string {
    if (!key) return '';
    
    const currentLang = this.getCurrentLanguage();
    
    // Si las traducciones no están cargadas aún, retornar fallback sin warning
    if (!this.translationsLoaded) {
      return this.getFallbackTranslation(key);
    }
    
    // Verificar si las traducciones están cargadas
    if (!this.translations[currentLang] || Object.keys(this.translations[currentLang]).length === 0) {
      // Solo mostrar warning una vez cuando ya deberían estar cargadas
      if (this.translationsLoaded) {
        console.warn(`Translations not loaded for language: ${currentLang}, using fallback`);
      }
      return this.getFallbackTranslation(key);
    }
    
    const translation = this.getNestedTranslation(this.translations[currentLang], key);
    
    if (typeof translation === 'string') {
      return this.interpolateParams(translation, params);
    }
    
    // Fallback al idioma por defecto si no encuentra en el idioma actual
    if (currentLang !== 'es') {
      const fallbackTranslation = this.getNestedTranslation(this.translations.es, key);
      if (typeof fallbackTranslation === 'string') {
        return this.interpolateParams(fallbackTranslation, params);
      }
    }
    
    // Último fallback
    return this.getFallbackTranslation(key);
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

  private getFallbackTranslation(key: string): string {
    // Traducciones básicas de fallback
    const fallbackTranslations: { [key: string]: string } = {
      'common.loading': 'Cargando...',
      'upload.title': 'Subir Nuevo Fondo',
      'upload.titleLabel': 'Título',
      'upload.titlePlaceholder': 'Nombre de tu fondo de pantalla',
      'upload.descriptionLabel': 'Descripción',
      'upload.descriptionPlaceholder': 'Describe tu fondo de pantalla (opcional)',
      'upload.categoryLabel': 'Categoría',
      'upload.categoryPlaceholder': 'Selecciona una categoría',
      'upload.tagsLabel': 'Etiquetas',
      'upload.tagsPlaceholder': 'naturaleza, paisaje, montaña',
      'upload.tagsNote': 'Separa las etiquetas con comas',
      'upload.makePublic': 'Hacer público',
      'upload.makePublicDescription': 'Otros usuarios podrán ver y descargar tu fondo',
      'upload.uploadButton': 'Subir Fondo',
      'upload.uploading': 'Subiendo...',
      'upload.selectImage': 'Toca para seleccionar una imagen',
      'upload.titleRequired': 'El título es requerido',
      'upload.titleMinLength': 'El título debe tener al menos 3 caracteres',
      'upload.categoryRequired': 'La categoría es requerida',
      'upload.discardChanges': '¿Descartar cambios?',
      'upload.discardChangesMessage': 'Se perderán todos los cambios no guardados',
      'common.cancel': 'Cancelar',
      'common.accept': 'Aceptar',
      'categories.nature': 'Naturaleza',
      'categories.abstract': 'Abstracto',
      'categories.minimal': 'Minimalista',
      'categories.landscape': 'Paisaje',
      'categories.city': 'Ciudad',
      'categories.space': 'Espacio',
      'categories.animals': 'Animales',
      'categories.art': 'Arte',
      'categories.technology': 'Tecnología',
      'categories.other': 'Otro'
    };

    return fallbackTranslations[key] || key;
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

  // Método optimizado para inicialización de páginas
  async initializePageTranslations(): Promise<void> {
    const isMobile = typeof window !== 'undefined' && (window as any).Capacitor;
    
    if (isMobile) {
      // En móviles, no bloquear la carga
      console.log('Mobile device: initializing translations in background');
      this.waitForTranslations().catch(error => {
        console.warn('Background translation loading failed:', error);
      });
      return;
    } else {
      // En web, esperar con timeout corto
      try {
        await Promise.race([
          this.waitForTranslations(),
          new Promise<void>(resolve => setTimeout(resolve, 1000)) // 1 segundo máximo
        ]);
      } catch (error) {
        console.warn('Translation initialization timeout:', error);
      }
    }
  }
}