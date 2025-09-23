import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const noAuthGuard: CanActivateFn = async (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  try {
    // Verifico si el usuario NO está autenticado
    const user = await auth.getCurrentUser();
    
    if (!user) {
      console.log('Usuario no autenticado, permitiendo acceso a:', state.url);
      return true;
    } else {
      console.log('Usuario ya autenticado, redirigiendo al home desde:', state.url);
      
      // Si ya está autenticado, redirijo al home
      router.navigate(['/home']);
      return false;
    }
  } catch (error) {
    console.error('Error en no-auth guard:', error);
    
    // En caso de error, permito acceso (asumo que no está autenticado)
    return true;
  }
};