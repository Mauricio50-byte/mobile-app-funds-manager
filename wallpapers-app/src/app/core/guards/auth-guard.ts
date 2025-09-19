import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthProvider } from '../providers/auth.provider';

export const authGuard: CanActivateFn = async (route, state) => {
  const authProvider = inject(AuthProvider);
  const router = inject(Router);

  try {
    // Verificar si el usuario está autenticado
    const isAuthenticated = authProvider.isAuthenticated();
    const user = authProvider.getCurrentUser();
    
    if (isAuthenticated && user) {
      console.log('Usuario autenticado, permitiendo acceso a:', state.url);
      return true;
    } else {
      console.log('Usuario no autenticado, redirigiendo al login desde:', state.url);
      
      // Guardar la URL a la que intentaba acceder para redirigir después del login
      const returnUrl = state.url !== '/login' ? state.url : '/home';
      
      // Redirigir al login con la URL de retorno
      router.navigate(['/login'], { 
        queryParams: { returnUrl } 
      });
      
      return false;
    }
  } catch (error) {
    console.error('Error en auth guard:', error);
    
    // En caso de error, redirigir al login por seguridad
    router.navigate(['/login']);
    return false;
  }
};
