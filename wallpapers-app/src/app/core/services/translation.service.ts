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

  private translations: { [key in Language]: Translations } = {
    es: {},
    en: {}
  };

  constructor(private http: HttpClient) {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    await this.loadTranslations();
    
    // Detectar idioma del navegador
    const browserLang = navigator.language.split('-')[0] as Language;
    this.currentLanguage = this.supportedLanguages.includes(browserLang) ? browserLang : 'es';
    
    // Cargar idioma guardado
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && this.supportedLanguages.includes(savedLang)) {
      this.currentLanguage = savedLang;
    }
    
    this.languageSubject.next(this.currentLanguage);
    this.currentLanguageSubject.next(this.currentLanguage);
  }

  private async loadTranslations(): Promise<void> {
    try {
      console.log('Loading translations...');
      // Cargar traducciones desde archivos JSON usando lastValueFrom
      const [esTranslations, enTranslations] = await Promise.all([
        lastValueFrom(this.http.get<Translations>('assets/i18n/es.json')),
        lastValueFrom(this.http.get<Translations>('assets/i18n/en.json'))
      ]);

      this.translations.es = esTranslations || {};
      this.translations.en = enTranslations || {};
      console.log('Translations loaded successfully:', { es: !!esTranslations, en: !!enTranslations });
    } catch (error) {
      console.error('Error loading translations:', error);
      // Fallback a traducciones básicas si falla la carga
      this.translations.es = {
        common: { loading: 'Cargando...', error: 'Error' },
        home: { title: 'Inicio' }
      };
      this.translations.en = {
        common: { loading: 'Loading...', error: 'Error' },
        home: { title: 'Home' }
      };
    }
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

  translate(key: string, params?: string[]): string {
    if (!key) return '';
    
    const currentLang = this.getCurrentLanguage();
    
    // Verificar si las traducciones están cargadas
    if (!this.translations[currentLang] || Object.keys(this.translations[currentLang]).length === 0) {
      console.warn(`Translations not loaded for language: ${currentLang}, using fallback`);
      // Retornar traducciones básicas como fallback
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
}