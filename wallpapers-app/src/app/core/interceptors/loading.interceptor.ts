import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingController } from '@ionic/angular';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private loadingCount = 0;
  private loading: HTMLIonLoadingElement | null = null;

  constructor(private loadingController: LoadingController) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // No mostrar loading para requests de assets (traducciones, imágenes, etc.)
    if (req.url.includes('assets/') || req.url.includes('.json')) {
      return next.handle(req);
    }

    // Incrementar contador y mostrar loading si es necesario
    this.loadingCount++;
    this.showLoading();

    return next.handle(req).pipe(
      finalize(() => {
        // Decrementar contador y ocultar loading si es necesario
        this.loadingCount--;
        if (this.loadingCount === 0) {
          this.hideLoading();
        }
      })
    );
  }

  private async showLoading() {
    if (this.loadingCount === 1 && !this.loading) {
      this.loading = await this.loadingController.create({
        message: 'Cargando...',
        spinner: 'crescent',
        translucent: true,
        cssClass: 'custom-loading'
      });
      await this.loading.present();
    }
  }

  private async hideLoading() {
    if (this.loading) {
      await this.loading.dismiss();
      this.loading = null;
    }
  }
}