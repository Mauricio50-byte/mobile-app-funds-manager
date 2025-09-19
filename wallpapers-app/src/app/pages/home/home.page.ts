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

  ngOnInit() {
  }

  navigateToUpdateUserInfo() {
    this.router.navigate(['/update-user-info']);
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
