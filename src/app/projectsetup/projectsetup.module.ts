import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectsetupComponent } from './projectsetup.component';
import { AppRoutingModule } from '../app-routing.module';
import { ToastModule } from 'primeng/toast';



@NgModule({
  declarations: [

  ],
  imports: [
    CommonModule,
    AppRoutingModule,
    ToastModule
  ]
})
export class ProjectsetupModule { }
