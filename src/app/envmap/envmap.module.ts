import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnvmapComponent } from './envmap.component';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputMaskModule } from 'primeng/inputmask';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { DropdownModule } from 'primeng/dropdown';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastModule } from 'primeng/toast';


@NgModule({
  declarations: [

  ],
  imports: [
    CommonModule,
    InputTextModule,
    ButtonModule,
    FormsModule,
    InputGroupModule,
    InputSwitchModule,
    InputTextareaModule,
    InputMaskModule,
    InputGroupAddonModule,
    DropdownModule,
    ToastModule
  ]
})
export class EnvmapModule { }
