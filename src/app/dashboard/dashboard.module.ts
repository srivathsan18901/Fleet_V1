import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { SidenavbarComponent } from '../sidenavbar/sidenavbar.component';
import { ToastModule } from 'primeng/toast';


@NgModule({
  declarations: [],
  imports: [CommonModule,ToastModule],
})
export class DashboardModule {}
