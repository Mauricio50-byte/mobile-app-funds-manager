import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {

  constructor(
    private router: Router,
    public translationService: TranslationService
  ) { }

  ngOnInit() {
  }

  navigateToUpdateUserInfo() {
    this.router.navigate(['/update-user-info']);
  }

}
