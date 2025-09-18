import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Auth } from '../../core/services/auth';
import { NativeToast } from '../../core/services/native-toast';
import { Loading } from '../../core/services/loading';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit, OnDestroy {
  registerForm: FormGroup;
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
    this.registerForm = this.createRegisterForm();
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private createRegisterForm(): FormGroup {
    return this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Validador personalizado para confirmar contraseña
  private passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  async onRegister() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      
      try {
        const { name, lastName, email, password } = this.registerForm.value;
        await this.authService.register(email, password, { name, lastName });
        
        const successMessage = this.translationService.translate('messages.registerSuccess');
        await this.toast.showSuccess(successMessage);
        this.router.navigate(['/login']);
      } catch (error: any) {
        console.error('Error en registro:', error);
        
        // Manejar errores específicos de Firebase
        let errorMessage = this.translationService.translate('messages.registerError');
        
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = this.translationService.translate('messages.emailInUse');
        } else if (error.code === 'auth/weak-password') {
          errorMessage = this.translationService.translate('messages.weakPassword');
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = this.translationService.translate('messages.invalidEmail');
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

  async onGoogleRegister() {
    this.isLoading = true;
    
    try {
      await this.authService.loginWithGoogle();
      
      const successMessage = this.translationService.translate('messages.registerSuccess');
      await this.toast.showSuccess(successMessage);
      this.router.navigate(['/home']);
    } catch (error: any) {
      console.error('Error en Google register:', error);
      const errorMessage = this.translationService.translate('messages.googleRegisterError');
      await this.toast.showError(errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  getNameErrorMessage(): string {
    const nameControl = this.registerForm.get('name');
    if (nameControl?.errors?.['required']) {
      return this.translationService.translate('validation.required');
    }
    if (nameControl?.errors?.['minlength']) {
      return this.translationService.translate('validation.minLength', ['2']);
    }
    return '';
  }

  getLastNameErrorMessage(): string {
    const lastNameControl = this.registerForm.get('lastName');
    if (lastNameControl?.errors?.['required']) {
      return this.translationService.translate('validation.required');
    }
    if (lastNameControl?.errors?.['minlength']) {
      return this.translationService.translate('validation.minLength', ['2']);
    }
    return '';
  }

  getEmailErrorMessage(): string {
    const emailControl = this.registerForm.get('email');
    if (emailControl?.errors?.['required']) {
      return this.translationService.translate('validation.required');
    }
    if (emailControl?.errors?.['email']) {
      return this.translationService.translate('validation.email');
    }
    return '';
  }

  getPasswordErrorMessage(): string {
    const passwordControl = this.registerForm.get('password');
    if (passwordControl?.errors?.['required']) {
      return this.translationService.translate('validation.required');
    }
    if (passwordControl?.errors?.['minlength']) {
      return this.translationService.translate('validation.minLength', ['6']);
    }
    return '';
  }

  getConfirmPasswordErrorMessage(): string {
    const confirmPasswordControl = this.registerForm.get('confirmPassword');
    if (confirmPasswordControl?.errors?.['required']) {
      return this.translationService.translate('validation.required');
    }
    if (this.registerForm.errors?.['passwordMismatch']) {
      return this.translationService.translate('validation.passwordMismatch');
    }
    return '';
  }
}
