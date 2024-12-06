import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ProjectsetupComponent } from './projectsetup/projectsetup.component';
import { AuthGuard } from './auth.guard';
import { ProjectGuard } from './guards/project.guard';
import { AuthService } from './auth.service';
import { AdminGuard } from './admin.guard';

//App Components on Sidebar
import { DashboardComponent } from './dashboard/dashboard.component'; //Dashboard
import { RobotDashboardComponent } from './robot-dashboard/robot-dashboard.component';
import { StatisticsComponent } from './statistics/statistics.component'; //Statistics
import { RobotsComponent } from './robots/robots.component'; //Robots
import { ConfigurationComponent } from './configuration/configuration.component'; //Configuration
import { Userlogscomponent } from './userlogs/userlogs.component'; //Logs
import { TasksComponent } from './tasks/tasks.component'; //Tasks
import { UserManagementComponent } from './user-management/user-management.component'; //User Management
import { SupportComponent } from './support/support.component'; //Support
import { FaqComponent } from './faq/faq.component';
import { LoaderComponent } from './loader/loader.component';

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
    canActivate: [AdminGuard, AuthGuard, ProjectGuard],
  },

  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard, ProjectGuard], // Ensure both guards are here
  },
  {
    path: 'usermanagement',
    component: UserManagementComponent,
    canActivate: [AdminGuard, AuthGuard, ProjectGuard], // Ensure both guards are here
  },
  {
    path: 'support',
    component: SupportComponent,
    canActivate: [AuthGuard, ProjectGuard], // Ensure both guards are here
  },

  { path: 'statistics/operation', component: StatisticsComponent },
  { path: 'statistics/robot', component: RobotDashboardComponent },
  { path: '', redirectTo: '/statistics/operation', pathMatch: 'full' },

  { path: 'faq', component: FaqComponent },
  { path: 'support', component: SupportComponent },

  // view all for  operation
  { path: 'statistics', component: StatisticsComponent },
  { path: 'tasks', component: TasksComponent }, // Define the tasks route
  { path: '', redirectTo: '/statistics', pathMatch: 'full' }, // Default route

  // view all for robot
  { path: 'robot-dashboard', component: RobotDashboardComponent },
  { path: 'tasks', component: TasksComponent }, // Define the tasks route
  { path: '', redirectTo: '/robot-dashboard', pathMatch: 'full' }, // Default route

  { path: 'loader', component: LoaderComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthService, AuthGuard],
})
export class AppRoutingModule {}
