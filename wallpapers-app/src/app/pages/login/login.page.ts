import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthProvider } from '../../core/providers/auth.provider';
import { NativeToast } from '../../core/services/native-toast';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit, OnDestroy {
  loginForm: FormGroup;
  isLoading = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private formBuilder: FormBuilder,
    private authProvider: AuthProvider,
    private router: Router,
    private toast: NativeToast,
    public translationService: TranslationService
  ) {
    this.loginForm = this.createLoginForm();
  }

  async ngOnInit() {
    // Inicializar traducciones de forma optimizada para móviles
    await this.translationService.initializePageTranslations();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private createLoginForm(): FormGroup {
    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      
      try {
        const { email, password } = this.loginForm.value;
        await this.authProvider.login({ email, password });
        
        const successMessage = this.translationService.translate('messages.loginSuccess');
        await this.toast.showSuccess(successMessage);
        this.router.navigate(['/home']);
      } catch (error: any) {
        console.error('Error en login:', error);
        let errorMessage = this.translationService.translate('messages.loginError');
        
        // Manejo específico de errores de Firebase
        if (error.code) {
          switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
              errorMessage = this.translationService.translate('messages.invalidCredentials');
              break;
            case 'auth/user-disabled':
              errorMessage = this.translationService.translate('messages.userDisabled');
              break;
            case 'auth/too-many-requests':
              errorMessage = this.translationService.translate('messages.tooManyRequests');
              break;
            case 'auth/network-request-failed':
              errorMessage = this.translationService.translate('errors.networkError');
              break;
            default:
              errorMessage = `${errorMessage}: ${error.message}`;
          }
        }
        
        await this.toast.showError(errorMessage);
      } finally {
        this.isLoading = false;
      }
    } else {
      const warningMessage = this.translationService.translate('validation.required');
      await this.toast.showWarning(warningMessage);
    }
  }

  async onGoogleLogin() {
    this.isLoading = true;
    
    try {
      await this.authProvider.loginWithGoogle();
      
      const successMessage = this.translationService.translate('messages.loginSuccess');
      await this.toast.showSuccess(successMessage);
      this.router.navigate(['/home']);
    } catch (error: any) {
      console.error('Error en Google login:', error);
      let errorMessage = this.translationService.translate('messages.googleLoginError');
      
      // Manejo específico de errores de Google login
      if (error.message) {
        if (error.message.includes('popup')) {
          if (error.message.includes('closed')) {
            errorMessage = this.translationService.translate('messages.popupClosedByUser');
          } else if (error.message.includes('blocked')) {
            errorMessage = this.translationService.translate('messages.popupBlocked');
          }
        } else if (error.message.includes('network') || error.message.includes('conexión')) {
          errorMessage = this.translationService.translate('errors.networkError');
        } else if (error.message.includes('Firestore') || error.message.includes('database')) {
          errorMessage = this.translationService.translate('messages.firestoreConfigRequired');
        }
      }
      
      await this.toast.showError(errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  getEmailErrorMessage(): string {
    const emailControl = this.loginForm.get('email');
    if (emailControl?.errors?.['required']) {
      return this.translationService.translate('validation.required');
    }
    if (emailControl?.errors?.['email']) {
      return this.translationService.translate('validation.email');
    }
    return '';
  }

  getPasswordErrorMessage(): string {
    const passwordControl = this.loginForm.get('password');
    if (passwordControl?.errors?.['required']) {
      return this.translationService.translate('validation.required');
    }
    if (passwordControl?.errors?.['minlength']) {
      return this.translationService.translate('validation.minLength', ['6']);
    }
    return '';
  }
}
