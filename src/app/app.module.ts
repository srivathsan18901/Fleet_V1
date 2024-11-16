import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import {
  BrowserModule,
  provideClientHydration,
} from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { LoginComponent } from './login/login.component';
import { ProjectsetupComponent } from './projectsetup/projectsetup.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SidenavbarComponent } from './sidenavbar/sidenavbar.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { ConfigurationComponent } from './configuration/configuration.component';
import { Userlogscomponent } from './userlogs/userlogs.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ChartComponent } from './chart/chart.component';
import { UptimeComponent } from './uptime/uptime.component';
import { ThroughputComponent } from './throughput/throughput.component';
import { NgxCaptureModule } from 'ngx-capture';
import { RobotsComponent } from './robots/robots.component';
import { OperationPieComponent } from './operation-pie/operation-pie.component';
import { Chart1Component } from './chart1/chart1.component';
import { AreaChartComponent } from './area-chart/area-chart.component';
import { rootCertificates } from 'tls';
import { RobotPopupComponent } from './robot-popup/robot-popup.component';
import { IPScannerComponent } from './ipscanner/ipscanner.component';
import { RobotParametersPopupComponent } from './robot-parameters-popup/robot-parameters-popup.component';
import { EnvmapComponent } from './envmap/envmap.component';
import { RobotDashboardComponent } from './robot-dashboard/robot-dashboard.component';
import { RouterModule } from '@angular/router';
import { ChartTimelineComponent } from './chart-timeline/chart-timeline.component';
import { GradientDonutComponent } from './gradient-donut/gradient-donut.component';
import { RobotActivityDonutComponent } from './robot-activity-donut/robot-activity-donut.component';
import { RobotDetailPopupComponent } from './robot-detail-popup/robot-detail-popup.component';
import { MatDialogModule } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { TasksComponent } from './tasks/tasks.component';
import { EnvmapModule } from './envmap/envmap.module';
import { MatPaginatorModule } from '@angular/material/paginator';
import { UserManagementComponent } from './user-management/user-management.component';
import { FullscreenButtonComponent } from './fullscreen-button/fullscreen-button.component';
import { ConfigurationModule } from './configuration/configuration.module';
import { DropdownModule } from 'primeng/dropdown';import { RadialChartComponent } from './radial-chart/radial-chart.component';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AppServerModule } from './app.module.server';
import { SupportComponent } from './support/support.component';
import { FaqComponent } from './faq/faq.component';
import { CheckboxModule } from 'primeng/checkbox';
import { ContactusComponent } from './support/Addons/contactus/contactus.component';
import { DialogModule } from 'primeng/dialog';
import { LoaderComponent } from './loader/loader.component';
import { TimerComponent } from './timer/timer.component';
// import { ReactiveFormsModule } from '@angular/forms';
// import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputMaskModule } from 'primeng/inputmask';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
// import { BrowserModule } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';




@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SidenavbarComponent,
    DashboardComponent,
    ProjectsetupComponent,
    ConfigurationComponent,
    RobotPopupComponent,
    RobotsComponent,
    RobotParametersPopupComponent,
    IPScannerComponent,
    Userlogscomponent,
    StatisticsComponent,
    EnvmapComponent,
    RobotsComponent,
    ChartComponent,
    UptimeComponent,
    ThroughputComponent,
    OperationPieComponent,
    Chart1Component,
    AreaChartComponent,
    RobotPopupComponent,
    EnvmapComponent,
    RobotDashboardComponent,
    ChartTimelineComponent,
    GradientDonutComponent,
    RobotActivityDonutComponent,
    RobotDetailPopupComponent,
    ConfirmationDialogComponent,
    TasksComponent,
    UserManagementComponent,
    FullscreenButtonComponent,
    RadialChartComponent,
    SupportComponent,
    FaqComponent,
    ContactusComponent,
    LoaderComponent,
    TimerComponent
  ],
  imports: [
    NgApexchartsModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    BrowserModule,
    RouterModule.forRoot([]),
    NgApexchartsModule,
    EnvmapModule,
    MatDialogModule,
    MatPaginatorModule,
    ConfigurationModule,
    InputTextModule,
    ButtonModule,
    DropdownModule,
    ToastModule,
    AppServerModule,
    CheckboxModule,
    DialogModule,
    InputGroupModule,
    InputSwitchModule,
    InputTextareaModule,
    InputMaskModule,
    InputGroupAddonModule,
    TableModule,

    PaginatorModule,
    // TableModule
  ],
  providers: [
    // provideClientHydration()

    provideAnimationsAsync(),
    MessageService,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent],
})
export class AppModule {}
