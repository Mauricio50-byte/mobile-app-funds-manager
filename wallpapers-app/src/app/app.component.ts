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
    // En dispositivos móviles, no bloquear la carga esperando traducciones
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      // Inicializar traducciones en background sin bloquear
      this.translationService.waitForTranslations().catch(error => {
        console.warn('Background translation loading failed:', error);
      });
    } else {
      // En web, esperar las traducciones
      await this.translationService.waitForTranslations();
    }
  }
}
