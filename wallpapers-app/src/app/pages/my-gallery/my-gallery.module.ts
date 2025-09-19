import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MyGalleryPageRoutingModule } from './my-gallery-routing.module';

import { MyGalleryPage } from './my-gallery.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MyGalleryPageRoutingModule
  ],
  declarations: [MyGalleryPage]
})
export class MyGalleryPageModule {}
