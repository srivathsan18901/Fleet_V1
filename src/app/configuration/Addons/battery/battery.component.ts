import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
interface DB {
  name: string;
  code: string;
}
@Component({
  selector: 'app-battery',
  templateUrl: './battery.component.html',
  styleUrl: './battery.component.css'
})
export class BatteryComponent {
  dtype: DB[] | undefined;
  iptype: DB[] | undefined;

    selectedDb: DB | undefined;

    ngOnInit() {
        this.dtype = [
            { name: 'PostgreSQL', code: 'NY' },
            { name: 'MongoDB', code: 'RM' },
            { name: 'SQL', code: 'LDN' },
        ];
        this.iptype = [
          { name: 'PostgreSQL', code: 'NY' },
          { name: 'MongoDB', code: 'RM' },
          { name: 'SQL', code: 'LDN' },
      ];
    }

    batteryForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.batteryForm = this.fb.group({
      battery: [50, [Validators.required, Validators.min(0), Validators.max(100)]], // Default to 50%
    });
  }

  onBatteryChange() {
    // Additional logic on battery percentage change if needed
  }

  onSubmit() {
    if (this.batteryForm.valid) {
      const batteryPercentage = this.batteryForm.value.battery;
      console.log('Battery Percentage:', batteryPercentage);
      // Handle battery percentage submission logic here
    }
  }
}
