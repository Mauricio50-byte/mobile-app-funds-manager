import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslationService, Language } from '../../../core/services/translation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-language-toggle',
  templateUrl: './language-toggle.component.html',
  styleUrls: ['./language-toggle.component.scss'],
  standalone: false
})
export class LanguageToggleComponent implements OnInit, OnDestroy {
  currentLanguage: Language = 'es';
  private subscription: Subscription = new Subscription();

  constructor(private translationService: TranslationService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.translationService.currentLanguage$.subscribe(language => {
        this.currentLanguage = language;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  toggleLanguage(): void {
    const newLanguage: Language = this.currentLanguage === 'es' ? 'en' : 'es';
    this.translationService.setLanguage(newLanguage);
  }

  getLanguageText(): string {
    return this.currentLanguage === 'es' ? 'ES' : 'EN';
  }

  getLanguageIcon(): string {
    return this.currentLanguage === 'es' ? '🇪🇸' : '🇺🇸';
  }
}