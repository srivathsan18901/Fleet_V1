import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from '../app-routing.module';
import { SidenavbarComponent } from '../sidenavbar/sidenavbar.component';
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
export class RobotsModule { }
