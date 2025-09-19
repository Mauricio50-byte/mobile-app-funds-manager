import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UploadWallpaperPageRoutingModule } from './upload-wallpaper-routing.module';

import { UploadWallpaperPage } from './upload-wallpaper.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    UploadWallpaperPageRoutingModule
  ],
  declarations: [UploadWallpaperPage]
})
export class UploadWallpaperPageModule {}
