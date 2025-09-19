import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule),
    canActivate: [authGuard]
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
    loadChildren: () => import('./pages/update-user-info/update-user-info.module').then( m => m.UpdateUserInfoPageModule),
    canActivate: [authGuard]
  },
  {
    path: 'my-gallery',
    loadChildren: () => import('./pages/my-gallery/my-gallery.module').then( m => m.MyGalleryPageModule),
    canActivate: [authGuard]
  },
  {
    path: 'upload-wallpaper',
    loadChildren: () => import('./pages/upload-wallpaper/upload-wallpaper.module').then( m => m.UploadWallpaperPageModule),
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
