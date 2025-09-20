import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class Loading {
  private loadingElement: HTMLIonLoadingElement | null = null;

  constructor(
    private loadingController: LoadingController
  ) {}

  async show(message?: string): Promise<void> {
    if (this.loadingElement) {
      await this.hide();
    }

    const loadingMessage = message || 'Cargando...';

    this.loadingElement = await this.loadingController.create({
      message: loadingMessage,
      spinner: 'crescent'
    });

    await this.loadingElement.present();
  }

  async hide(): Promise<void> {
    if (this.loadingElement) {
      await this.loadingElement.dismiss();
      this.loadingElement = null;
    }
  }

  async showWithDuration(message?: string, duration: number = 3000): Promise<void> {
    await this.show(message);
    setTimeout(async () => {
      await this.hide();
    }, duration);
  }
}