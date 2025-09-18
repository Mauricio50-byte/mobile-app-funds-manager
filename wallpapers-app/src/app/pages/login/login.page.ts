import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../core/services/auth';
import { NativeToast } from '../../core/services/native-toast';
import { Loading } from '../../core/services/loading';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: Auth,
    private router: Router,
    private toast: NativeToast,
    private loading: Loading
  ) {
    this.loginForm = this.createLoginForm();
  }

  ngOnInit() {
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
        
        await this.toast.showSuccess('¡Bienvenido!');
        this.router.navigate(['/home']);
      } catch (error: any) {
        console.error('Error en login:', error);
        await this.toast.showError('Error al iniciar sesión: ' + error.message);
      } finally {
        this.isLoading = false;
      }
    } else {
      await this.toast.showWarning('Por favor completa todos los campos correctamente');
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  getEmailErrorMessage(): string {
    const emailControl = this.loginForm.get('email');
    if (emailControl?.errors?.['required']) {
      return 'El email es requerido';
    }
    if (emailControl?.errors?.['email']) {
      return 'Formato de email inválido';
    }
    return '';
  }

  getPasswordErrorMessage(): string {
    const passwordControl = this.loginForm.get('password');
    if (passwordControl?.errors?.['required']) {
      return 'La contraseña es requerida';
    }
    if (passwordControl?.errors?.['minlength']) {
      return 'Mínimo 6 caracteres';
    }
    return '';
  }
}
