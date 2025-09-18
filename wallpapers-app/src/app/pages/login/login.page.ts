import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Auth } from '../../core/services/auth';
import { NativeToast } from '../../core/services/native-toast';
import { Loading } from '../../core/services/loading';
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
    private authService: Auth,
    private router: Router,
    private toast: NativeToast,
    private loading: Loading,
    public translationService: TranslationService
  ) {
    this.loginForm = this.createLoginForm();
  }

  ngOnInit() {
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
        await this.authService.login(email, password);
        
        const successMessage = this.translationService.translate('messages.loginSuccess');
        await this.toast.showSuccess(successMessage);
        this.router.navigate(['/home']);
      } catch (error: any) {
        console.error('Error en login:', error);
        const errorMessage = this.translationService.translate('messages.loginError');
        await this.toast.showError(`${errorMessage}: ${error.message}`);
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
      await this.authService.loginWithGoogle();
      
      const successMessage = this.translationService.translate('messages.loginSuccess');
      await this.toast.showSuccess(successMessage);
      this.router.navigate(['/home']);
    } catch (error: any) {
      console.error('Error en Google login:', error);
      const errorMessage = this.translationService.translate('messages.googleLoginError');
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
