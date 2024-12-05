import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigurationComponent } from './configuration.component';
import { IPScannerComponent } from '../ipscanner/ipscanner.component';
// import { GeneralComponent } from './Addons/general/general.component';
// import { PlannerComponent } from './Addons/planner/planner.component';
// import { TaskComponent } from './Addons/task/task.component';
// import { BatteryComponent } from './Addons/battery/battery.component';
// import { CommunicationComponent } from './Addons/communication/communication.component';
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
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToastModule } from 'primeng/toast';
import { ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
@NgModule({
  declarations: [
            // GeneralComponent,
            //  PlannerComponent,
            //  TaskComponent,
            //  BatteryComponent,
            //  CommunicationComponent,

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
    RadioButtonModule,
    ToastModule,
    ReactiveFormsModule,

  ],
  exports: [
    //  GeneralComponent,
    //  PlannerComponent,
    //  TaskComponent,
    //  BatteryComponent,
    //  CommunicationComponent,
     InputGroupModule,
     InputTextModule,
],
schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ConfigurationModule { }
