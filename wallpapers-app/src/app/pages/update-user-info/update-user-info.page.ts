import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../core/services/translation.service';
import { NativeToast } from '../../core/services/native-toast';
import { AuthProvider } from '../../core/providers/auth.provider';
import { UserData } from '../../core/interfaces';

@Component({
  selector: 'app-update-user-info',
  templateUrl: './update-user-info.page.html',
  styleUrls: ['./update-user-info.page.scss'],
  standalone: false
})
export class UpdateUserInfoPage implements OnInit, OnDestroy {
  updateForm: FormGroup;
  isLoading = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    public translationService: TranslationService,
    private toast: NativeToast,
    private authProvider: AuthProvider
  ) {
    this.updateForm = this.createUpdateForm();
  }

  ngOnInit() {
    // Suscribirse al estado de autenticación para esperar a que esté listo
    this.subscription.add(
      this.authProvider.currentUser$.subscribe(user => {
        if (user !== null) {
          // Usuario autenticado, cargar datos
          this.loadUserDataFromCurrentUser(user);
        } else {
          // No hay usuario autenticado, verificar si Firebase ya inicializó
          setTimeout(() => {
            if (!this.authProvider.getCurrentUser()) {
              this.redirectToLogin();
            }
          }, 1000); // Dar tiempo a Firebase para inicializar
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private createUpdateForm(): FormGroup {
    return this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      bio: ['']
    });
  }

  private loadUserDataFromCurrentUser(user: UserData) {
    try {
      // Cargar datos del usuario autenticado desde Firestore
      this.updateForm.patchValue({
        name: user.name || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || ''
      });
      
      // Deshabilitar el campo de email ya que no debe ser editable
      this.updateForm.get('email')?.disable();
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
      this.toast.showError(
        this.translationService.translate('updateUserInfo.loadError')
      );
    }
  }

  private async redirectToLogin() {
    await this.toast.showError(
      this.translationService.translate('messages.loginRequired')
    );
    this.router.navigate(['/login']);
  }

  async onUpdateUserInfo() {
    if (this.updateForm.valid && !this.isLoading) {
      this.isLoading = true;

      try {
        // Verificar autenticación de manera robusta
        const currentUser = this.authProvider.getCurrentUser();
        
        if (!currentUser) {
          this.isLoading = false;
          await this.redirectToLogin();
          return;
        }

        // Preparar datos actualizados del formulario (excluyendo email)
        const formData = this.updateForm.value;
        const updatedUserData: Partial<UserData> = {
          name: formData.name,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          bio: formData.bio || undefined,
          updatedAt: new Date()
        };

        // Actualizar datos del usuario en Firestore
        await this.authProvider.updateUserData(updatedUserData);
        
        await this.toast.showSuccess(
          this.translationService.translate('updateUserInfo.updateSuccess')
        );
        
        this.router.navigate(['/home']);
      } catch (error) {
        console.error('Error actualizando datos del usuario:', error);
        await this.toast.showError(
          this.translationService.translate('updateUserInfo.updateError')
        );
      } finally {
        this.isLoading = false;
      }
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  // Métodos para obtener mensajes de error
  getNameErrorMessage(): string {
    const nameControl = this.updateForm.get('name');
    if (nameControl?.hasError('required')) {
      return this.translationService.translate('validation.required');
    }
    if (nameControl?.hasError('minlength')) {
      return this.translationService.translate('validation.minLength', ['2']);
    }
    return '';
  }

  getLastNameErrorMessage(): string {
    const lastNameControl = this.updateForm.get('lastName');
    if (lastNameControl?.hasError('required')) {
      return this.translationService.translate('validation.required');
    }
    if (lastNameControl?.hasError('minlength')) {
      return this.translationService.translate('validation.minLength', ['2']);
    }
    return '';
  }

  getEmailErrorMessage(): string {
    const emailControl = this.updateForm.get('email');
    if (emailControl?.hasError('required')) {
      return this.translationService.translate('validation.required');
    }
    if (emailControl?.hasError('email')) {
      return this.translationService.translate('validation.email');
    }
    return '';
  }
}
