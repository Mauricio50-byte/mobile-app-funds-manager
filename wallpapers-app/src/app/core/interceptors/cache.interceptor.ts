import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, HttpResponse<any>>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Solo cachear requests GET de assets (traducciones, imágenes, etc.)
    if (req.method !== 'GET' || !this.shouldCache(req.url)) {
      return next.handle(req);
    }

    const cachedResponse = this.getFromCache(req.url);
    if (cachedResponse) {
      console.log(`Cache hit for: ${req.url}`);
      return of(cachedResponse);
    }

    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          console.log(`Caching response for: ${req.url}`);
          this.addToCache(req.url, event);
        }
      })
    );
  }

  private shouldCache(url: string): boolean {
    // Cachear solo archivos de assets específicos, EXCLUYENDO traducciones para evitar problemas
    return (url.includes('assets/') && !url.includes('i18n/')) || 
           url.includes('.png') || 
           url.includes('.jpg') || 
           url.includes('.jpeg') || 
           url.includes('.svg') ||
           url.includes('.ico');
  }

  private getFromCache(url: string): HttpResponse<any> | null {
    const cached = this.cache.get(url);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    const cachedTime = cached.headers.get('cached-time');
    
    if (cachedTime && (now - parseInt(cachedTime)) > this.CACHE_DURATION) {
      this.cache.delete(url);
      return null;
    }

    return cached;
  }

  private addToCache(url: string, response: HttpResponse<any>): void {
    const responseToCache = response.clone({
      headers: response.headers.set('cached-time', Date.now().toString())
    });
    
    this.cache.set(url, responseToCache);

    // Limpiar cache si tiene más de 50 entradas
    if (this.cache.size > 50) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  public clearCache(): void {
    this.cache.clear();
  }
}