import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'wallpapersApp',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Optimizaciones para mejorar el rendimiento
    loggingBehavior: 'none',
    // Configuración para mejorar la carga de assets
    appendUserAgent: 'WallpapersApp',
    overrideUserAgent: undefined,
    backgroundColor: '#ffffff'
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500, // Reducir tiempo de splash
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true, // Mostrar spinner para indicar carga
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#007bff", // Color más visible
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: false // Cambiar a false para mejor rendimiento
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000'
    },
    WallpaperPlugin: {
      // Configuración del plugin personalizado
    }
  }
};

export default config;
