import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthProvider, WallpaperProvider } from './providers';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    AuthProvider,
    WallpaperProvider
  ]
})
export class CoreModule { }
