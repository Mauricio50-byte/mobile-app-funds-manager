import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { ButtonComponent } from './components/button/button.component';
import { InputComponent } from './components/input/input.component';
import { LanguageToggleComponent } from './components/language-toggle/language-toggle.component';

@NgModule({
  declarations: [
    ButtonComponent,
    InputComponent,
    LanguageToggleComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    IonicModule,
    ReactiveFormsModule,
    FormsModule
  ],
  exports: [
    ButtonComponent,
    InputComponent,
    LanguageToggleComponent,
    HttpClientModule
  ]
})
export class SharedModule { }
