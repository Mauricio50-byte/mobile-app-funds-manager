import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslationService } from '../../core/services/translation.service';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {

  constructor(
    private router: Router,
    public translationService: TranslationService,
    private auth: Auth
  ) { }

  async ngOnInit() {
    // Esperar a que las traducciones se carguen antes de renderizar
    await this.translationService.waitForTranslations();
  }

  navigateToUpdateUserInfo() {
    this.router.navigate(['/update-user-info']);
  }

  navigateToMyGallery() {
    this.router.navigate(['/my-gallery']);
  }

  navigateToUploadWallpaper() {
    this.router.navigate(['/upload-wallpaper']);
  }

  async logout() {
    try {
      await this.auth.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

}
