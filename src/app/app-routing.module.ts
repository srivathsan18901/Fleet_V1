import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ProjectsetupComponent } from './projectsetup/projectsetup.component';
import { AuthGuard } from './auth.guard';
import { StatisticsComponent } from './statistics/statistics.component';
import { ConfigurationComponent } from './configuration/configuration.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProjectGuard } from './guards/project.guard';
import { Userlogscomponent } from './userlogs/userlogs.component';

import { RobotsComponent } from './robots/robots.component';
import { RobotDashboardComponent } from './robot-dashboard/robot-dashboard.component';
import { TasksComponent } from './tasks/tasks.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { SupportComponent } from './support/support.component';
import { FaqComponent } from './faq/faq.component';

const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
    canActivate: [AuthGuard],
    data: { animation: 'LoginPage' },
  },
  {
    path: 'project_setup',
    component: ProjectsetupComponent,
    canActivate: [AuthGuard, ProjectGuard],
  },
  {
    path: 'statistics',
    component: StatisticsComponent,
    canActivate: [AuthGuard, ProjectGuard],
  },
  {
    path: 'robots',
    component: RobotsComponent,
    canActivate: [AuthGuard, ProjectGuard],
  },
  {
    path: 'tasks',
    component: TasksComponent,
    canActivate: [AuthGuard, ProjectGuard],
  },
  {
    path: 'Reports',
    component: Userlogscomponent,
    canActivate: [AuthGuard, ProjectGuard],
  },
  {
    path: 'configuration',
    component: ConfigurationComponent,
    canActivate: [AuthGuard, ProjectGuard],
  },
 
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard, ProjectGuard], // Ensure both guards are here
  },
  {
    path: 'usermanagement',
    component: UserManagementComponent,
    canActivate: [AuthGuard, ProjectGuard], // Ensure both guards are here
  },
  {
    path: 'support',
    component: SupportComponent,
    canActivate: [AuthGuard, ProjectGuard], // Ensure both guards are here
  },

  // { path: 'statistics/operation', component: StatisticsComponent },
  // { path: 'statistics/robot', component: RobotDashboardComponent },
  // { path: '', redirectTo: '/statistics/operation', pathMatch: 'full' },
  { path: 'statistics/operation', component: StatisticsComponent },
  { path: 'statistics/robot', component: RobotDashboardComponent },
  { path: '', redirectTo: '/statistics/operation', pathMatch: 'full' },
  { path: 'faq', component: FaqComponent },
  { path: 'support', component: SupportComponent },

  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
