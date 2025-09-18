import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { Auth, getAuth } from '@angular/fire/auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private auth: Auth) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // No agregar token para requests de assets, Firebase Auth, o archivos estáticos
    if (req.url.includes('assets/') || 
        req.url.includes('firebase') || 
        req.url.includes('googleapis.com') ||
        req.url.includes('identitytoolkit.googleapis.com') ||
        req.url.includes('securetoken.googleapis.com') ||
        req.url.includes('.json') ||
        req.url.includes('i18n/')) {
      return next.handle(req);
    }

    // Solo agregar token para requests a tu API backend
    if (!req.url.includes('firestore.googleapis.com') && 
        !req.url.includes('your-api-domain.com')) {
      return next.handle(req);
    }

    // Obtener el token del usuario actual
    return from(this.getAuthToken()).pipe(
      switchMap(token => {
        if (token) {
          // Clonar la request y agregar el header de autorización
          const authReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          return next.handle(authReq);
        } else {
          // Si no hay token, enviar la request original
          return next.handle(req);
        }
      })
    );
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const user = this.auth.currentUser;
      if (user) {
        return await user.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo token de autenticación:', error);
      return null;
    }
  }
}