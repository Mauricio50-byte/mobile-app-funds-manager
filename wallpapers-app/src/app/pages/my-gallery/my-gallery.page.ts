import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { WallpaperData, WallpaperFilter } from '../../core/interfaces/wallpaper.interface';
import { WallpaperService } from '../../core/services/wallpaper.service';
import { Auth } from '../../core/services/auth';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-my-gallery',
  templateUrl: './my-gallery.page.html',
  styleUrls: ['./my-gallery.page.scss'],
  standalone: false
})
export class MyGalleryPage implements OnInit {
  wallpapers: WallpaperData[] = [];
  isLoading = false;
  currentUser: any = null;

  constructor(
    private router: Router,
    private wallpaperService: WallpaperService,
    private auth: Auth,
    private alertController: AlertController,
    private toastController: ToastController,
    public translationService: TranslationService
  ) { }

  async ngOnInit() {
    // Inicializar traducciones de forma optimizada para móviles
    await this.translationService.initializePageTranslations();
    await this.loadCurrentUser();
    await this.loadMyWallpapers();
  }

  async ionViewWillEnter() {
    // Recargar wallpapers cada vez que se entra a la página
    await this.loadMyWallpapers();
  }

  private async loadCurrentUser() {
    try {
      this.currentUser = await this.auth.getCurrentUser();
    } catch (error) {
      console.error('Error loading current user:', error);
      this.router.navigate(['/login']);
    }
  }

  async loadMyWallpapers() {
    if (!this.currentUser) return;

    this.isLoading = true;
    try {
      // Uso el método getUserWallpapers que filtra automáticamente por UID del usuario autenticado
      this.wallpaperService.getUserWallpapers().subscribe({
        next: (wallpapers) => {
          this.wallpapers = wallpapers;
          this.isLoading = false;
        },
        error: async (error) => {
          console.error('Error loading user wallpapers:', error);
          await this.showToast('myGallery.loadError', 'danger');
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error loading user wallpapers:', error);
      await this.showToast('myGallery.loadError', 'danger');
      this.isLoading = false;
    }
  }

  async applyWallpaper(wallpaper: WallpaperData, type: 'home' | 'lock') {
    const alert = await this.alertController.create({
      header: this.translationService.translate('myGallery.applyWallpaper'),
      message: this.translationService.translate('myGallery.applyWallpaper'),
      buttons: [
        {
          text: this.translationService.translate('common.cancel'),
          role: 'cancel'
        },
        {
          text: this.translationService.translate('common.accept'),
          handler: async () => {
            await this.setWallpaper(wallpaper, type);
          }
        }
      ]
    });

    await alert.present();
  }

  private async setWallpaper(wallpaper: WallpaperData, type: 'home' | 'lock') {
    try {
      let success = false;
      
      if (type === 'home') {
        success = await this.wallpaperService.setWallpaperHomeScreen(wallpaper.imageUrl);
      } else if (type === 'lock') {
        success = await this.wallpaperService.setWallpaperLockScreen(wallpaper.imageUrl);
      }
      
      if (success) {
        await this.showToast('myGallery.wallpaperApplied', 'success');
      } else {
        await this.showToast('myGallery.applyError', 'danger');
      }
    } catch (error) {
      console.error('Error applying wallpaper:', error);
      await this.showToast('myGallery.applyError', 'danger');
    }
  }

  async deleteWallpaper(wallpaper: WallpaperData) {
    const alert = await this.alertController.create({
      header: this.translationService.translate('myGallery.confirmDelete'),
      message: this.translationService.translate('myGallery.confirmDeleteMessage'),
      buttons: [
        {
          text: this.translationService.translate('common.cancel'),
          role: 'cancel'
        },
        {
          text: this.translationService.translate('common.delete'),
          role: 'destructive',
          handler: () => {
            this.wallpaperService.deleteWallpaper(wallpaper.id!).subscribe({
              next: async () => {
                await this.showToast('myGallery.wallpaperDeleted', 'success');
                await this.loadMyWallpapers();
              },
              error: async (error) => {
                console.error('Error deleting wallpaper:', error);
                await this.showToast('myGallery.deleteError', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  private async performDelete(wallpaper: WallpaperData) {
    try {
      await this.wallpaperService.deleteWallpaper(wallpaper.id!);
      await this.loadMyWallpapers(); // Recargar la lista
      await this.showToast('myGallery.wallpaperDeleted', 'success');
    } catch (error) {
      console.error('Error deleting wallpaper:', error);
      await this.showToast('myGallery.deleteError', 'danger');
    }
  }

  navigateToUpload() {
    this.router.navigate(['/upload-wallpaper']);
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  private async showToast(messageKey: string, color: string) {
    const toast = await this.toastController.create({
      message: this.translationService.translate(messageKey),
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }

  async doRefresh(event: any) {
    await this.loadMyWallpapers();
    event.target.complete();
  }
}
