import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NativeToast } from '../services/native-toast';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  // Mensajes de error estáticos para evitar dependencia circular
  private readonly errorMessages = {
    0: 'Error de conexión. Verifica tu conexión a internet.',
    400: 'Solicitud incorrecta. Verifica los datos enviados.',
    401: 'No autorizado. Inicia sesión nuevamente.',
    403: 'Acceso denegado. No tienes permisos para esta acción.',
    404: 'Recurso no encontrado.',
    500: 'Error interno del servidor. Inténtalo más tarde.',
    503: 'Servicio no disponible. Inténtalo más tarde.',
    default: 'Error desconocido. Inténtalo nuevamente.'
  };

  constructor(private toast: NativeToast) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';

        if (error.error instanceof ErrorEvent) {
          // Error del lado del cliente
          errorMessage = `Error del cliente: ${error.error.message}`;
          console.error('Error del cliente:', error.error.message);
        } else {
          // Error del lado del servidor
          errorMessage = this.errorMessages[error.status as keyof typeof this.errorMessages] || this.errorMessages.default;
          
          console.error(`Error del servidor: ${error.status} - ${error.message}`);
        }

        // Mostrar toast de error solo para errores críticos, excluyendo traducciones
        if (error.status !== 404 && !req.url.includes('assets/i18n/') && !req.url.includes('.json')) {
          this.toast.showError(errorMessage);
        }

        return throwError(() => error);
      })
    );
  }
}