import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then( m => m.RegisterPageModule)
  },
  {
    path: 'update-user-info',
    loadChildren: () => import('./pages/update-user-info/update-user-info.module').then( m => m.UpdateUserInfoPageModule)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'my-gallery',
    loadChildren: () => import('./pages/my-gallery/my-gallery.module').then( m => m.MyGalleryPageModule)
  },
  {
    path: 'upload-wallpaper',
    loadChildren: () => import('./pages/upload-wallpaper/upload-wallpaper.module').then( m => m.UploadWallpaperPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
