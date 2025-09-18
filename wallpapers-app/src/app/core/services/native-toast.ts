import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class NativeToast {

  constructor(private toastController: ToastController) { }

  async showSuccess(message: string, duration: number = 3000): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'top',
      color: 'success',
      icon: 'checkmark-circle-outline'
    });
    await toast.present();
  }

  async showError(message: string, duration: number = 4000): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'top',
      color: 'danger',
      icon: 'alert-circle-outline'
    });
    await toast.present();
  }

  async showWarning(message: string, duration: number = 3500): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'top',
      color: 'warning',
      icon: 'warning-outline'
    });
    await toast.present();
  }
}
