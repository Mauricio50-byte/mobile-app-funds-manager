import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { TranslationService } from './core/services/translation.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit {
  constructor(
    private platform: Platform,
    private translationService: TranslationService
  ) {}

  async ngOnInit() {
    // Asegurar que las traducciones se carguen al inicio de la aplicación
    await this.translationService.waitForTranslations();
  }
}
