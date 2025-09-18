import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UpdateUserInfoPageRoutingModule } from './update-user-info-routing.module';
import { SharedModule } from '../../shared/shared-module';

import { UpdateUserInfoPage } from './update-user-info.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    UpdateUserInfoPageRoutingModule,
    SharedModule
  ],
  declarations: [UpdateUserInfoPage]
})
export class UpdateUserInfoPageModule {}
