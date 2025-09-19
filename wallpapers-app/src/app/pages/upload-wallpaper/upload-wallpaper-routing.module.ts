import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UploadWallpaperPage } from './upload-wallpaper.page';

const routes: Routes = [
  {
    path: '',
    component: UploadWallpaperPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UploadWallpaperPageRoutingModule {}
