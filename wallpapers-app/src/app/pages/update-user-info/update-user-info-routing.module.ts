import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UpdateUserInfoPage } from './update-user-info.page';

const routes: Routes = [
  {
    path: '',
    component: UpdateUserInfoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UpdateUserInfoPageRoutingModule {}
