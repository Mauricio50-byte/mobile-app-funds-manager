import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MyGalleryPage } from './my-gallery.page';

const routes: Routes = [
  {
    path: '',
    component: MyGalleryPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MyGalleryPageRoutingModule {}
