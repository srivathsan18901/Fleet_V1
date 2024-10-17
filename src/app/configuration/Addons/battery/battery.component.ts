import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectService } from '../../../services/project.service';
import { environment } from '../../../../environments/environment.development';

interface DB {
  name: string;
  code: string;
}
@Component({
  selector: 'app-battery',
  templateUrl: './battery.component.html',
  styleUrl: './battery.component.css',
})
export class BatteryComponent {
  selectedProj: any | null = null;
  batteryForm: any = {
    minBattery: 0,
    maxBattery: 0,
    warningBattery: 0,
    warningVoltage: 0,
    minimumVoltage: 0,
  };

  constructor(private fb: FormBuilder, private projectService: ProjectService) {
    /* this.batteryForm = this.fb.group({
      battery: [
        50,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ], // Default to 50%
    }); */
  }

  async ngOnInit() {
    this.selectedProj = this.projectService.getSelectedProject();
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-project/${this.selectedProj._id}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );
    if (!response.ok) {
      console.log('Err with status code of ', response.status);
    }
    let data = await response.json();
    const { Battery } = data.project.fleetParams;
    if (!Battery) return;
    this.batteryForm = {
      minBattery: Battery.minBattery,
      maxBattery: Battery.maxBattery,
      warningBattery: Battery.warningBattery,
      warningVoltage: Battery.warningVoltage,
      minimumVoltage: Battery.minimumVoltage,
    };
  }

  async saveBatteryParams() {
    // console.log(this.batteryForm); // handle here..
    try {
      let response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/config-fleet-params/battery`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: this.selectedProj._id,
            batteryParams: this.batteryForm,
          }),
        }
      );

      if (!response.ok)
        throw new Error(`err while saving db, ${response.status}`);

      let data = await response.json();
      // console.log(data);
      if (data.isSet) {
        alert('Fleet configured!');
        return;
      }
      alert('Fleet not configured!');
    } catch (error) {
      console.log('Err occured :', error);
    }
  }

  onBatteryChange() {
    // Additional logic on battery percentage change if needed
  }
}
