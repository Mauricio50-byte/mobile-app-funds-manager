import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthProvider, WallpaperProvider } from '../providers';

export const ownerGuard: CanActivateFn = async (route: ActivatedRouteSnapshot, state) => {
  const authProvider = inject(AuthProvider);
  const wallpaperProvider = inject(WallpaperProvider);
  const router = inject(Router);

  try {
    // Verificar si el usuario está autenticado
    const user = authProvider.getCurrentUser();
    
    if (!user) {
      console.log('Usuario no autenticado, redirigiendo al login');
      router.navigate(['/login'], { 
        queryParams: { returnUrl: state.url } 
      });
      return false;
    }

    // Obtener el ID del wallpaper de los parámetros de la ruta
    const wallpaperId = route.paramMap.get('id');
    
    if (!wallpaperId) {
      console.log('ID de wallpaper no encontrado en la ruta');
      router.navigate(['/home']);
      return false;
    }

    // Verificar si el wallpaper existe y pertenece al usuario
    const wallpaper = await wallpaperProvider.getWallpaperById(wallpaperId);
    
    if (!wallpaper) {
      console.log('Wallpaper no encontrado:', wallpaperId);
      router.navigate(['/home']);
      return false;
    }

    if (wallpaper.userId !== user.uid) {
      console.log('Usuario no es propietario del wallpaper:', wallpaperId);
      router.navigate(['/home']);
      return false;
    }

    console.log('Usuario es propietario del wallpaper, permitiendo acceso');
    return true;

  } catch (error) {
    console.error('Error en owner guard:', error);
    router.navigate(['/home']);
    return false;
  }
};