import { registerPlugin } from '@capacitor/core';

export interface WallpaperPluginInterface {
  /**
   * Establece el wallpaper para la pantalla principal
   * @param options - Opciones que incluyen imageUrl o base64Image
   */
  setWallpaperHomeScreen(options: { imageUrl?: string; base64Image?: string }): Promise<{ success: boolean; message: string }>;

  /**
   * Establece el wallpaper para la pantalla de bloqueo (Android 7.0+)
   * @param options - Opciones que incluyen imageUrl o base64Image
   */
  setWallpaperLockScreen(options: { imageUrl?: string; base64Image?: string }): Promise<{ success: boolean; message: string }>;

  /**
   * Establece el wallpaper para ambas pantallas (principal y bloqueo)
   * @param options - Opciones que incluyen imageUrl o base64Image
   */
  setBothWallpapers(options: { imageUrl?: string; base64Image?: string }): Promise<{ success: boolean; message: string }>;

  /**
   * Verifica los permisos necesarios para cambiar wallpapers
   */
  checkPermissions(): Promise<{ hasPermission: boolean; message: string }>;
}

const WallpaperPlugin = registerPlugin<WallpaperPluginInterface>('WallpaperPlugin');

export default WallpaperPlugin;