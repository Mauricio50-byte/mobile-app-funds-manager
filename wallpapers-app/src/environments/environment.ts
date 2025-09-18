// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSyDGNFNNK9yTnQdnAkLSttPqQnFrJTzQLPw",
    authDomain: "wallpapers-app-3743d.firebaseapp.com",
    projectId: "wallpapers-app-3743d",
    storageBucket: "wallpapers-app-3743d.firebasestorage.app",
    messagingSenderId: "582904277492",
    appId: "1:582904277492:web:53de2cc71043f8539bb1a1",
    measurementId: "G-F9E601BLQS"
  },
  supabase: {
    url: 'https://nxarxomkgbbvqxinfnbn.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YXJ4b21rZ2JidnF4aW5mbmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTI4NDgsImV4cCI6MjA3Mzc4ODg0OH0.qr3rMqs0UZMQtgBT-prn6qYEUZ26oPMBCwCvUOdgaxA'
  }
};

// Mantener compatibilidad con el nombre anterior
export const firebaseConfig = environment;

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
