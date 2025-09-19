import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingController } from '@ionic/angular';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private loadingCount = 0;
  private loading: HTMLIonLoadingElement | null = null;

  constructor(private loadingController: LoadingController) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.showLoading();

    return next.handle(request).pipe(
      finalize(() => {
        this.hideLoading();
      })
    );
  }

  private async showLoading() {
    this.loadingCount++;
    
    if (this.loadingCount === 1) {
      this.loading = await this.loadingController.create({
        message: 'Cargando...',
        spinner: 'crescent'
      });
      await this.loading.present();
    }
  }

  private async hideLoading() {
    this.loadingCount--;
    
    if (this.loadingCount === 0 && this.loading) {
      await this.loading.dismiss();
      this.loading = null;
    }
  }
}