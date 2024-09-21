import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface Robot {
isCharging: boolean;
networksrength: any;
currentMap: any;
currentTask: any;
batteryDistance: any;
currentSpeed: any;
averageSpeed: any;
distanceLeft: string;

  
 
  id: number;
  name: string;
  imageUrl: string;
  capacity: string;
  speed: string;
  accuracy: string;
  status: string;
  battery: string;
  serialNumber: string;
  temperature: string;
  networkstrength: string;
  robotutilization: string;
  cpuutilization: string;
  memory: string;
 totalPicks: string;
 totalDrops:string;
 SignalStrength: string;
  error: string;
  batteryPercentage: number;
  // new
  averagedischarge:number;
  averageChargingTime: string;
 currentspeed: string;
 averagespeed: string;
 maximumspeed: string;
 averagetransfertime: string;
 averagedockingtime: string;
  
}

@Component({
  selector: 'app-robot-detail-popup',
  templateUrl: './robot-detail-popup.component.html',
  styleUrls: ['./robot-detail-popup.component.scss']
})
export class RobotDetailPopupComponent {
  
  metrics: { title: string; value: string; icon: string }[] = [];
  // batteryData: any[] = [];  

  robot: any;
  currentSignalClass: any
  
  isConnected: boolean = false;

  toggleConnection() {
    this.isConnected = !this.isConnected;
  }

  isActive: boolean = false;  // Initially true

  toggleStatus() {
    this.isActive = !this.isActive;  // Toggle between true and false
  }

  onEmergencyStop() {
    alert('Emergency Stop Pressed!');
  }

  getClassForCircle(percentage: number, threshold: number): string {
    return percentage >= threshold ? 'filled' : '';
  }

 // Function to get battery color


// get batteryPercentage(): number {
//   return Number(this.data.batteryPercentage);
// }

// Getter for isCharging status
// get isCharging(): boolean {
//   return this.data.isCharging;
// }


  constructor(
    public dialogRef: MatDialogRef<RobotDetailPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Robot
  ) {
    
    
  }
 
  getBatteryColor(batteryPercentage: number): string {
    if (batteryPercentage >= 75) {
      return 'high'; // Green for high battery
    } else if (batteryPercentage >= 40) {
      return 'medium';
    } else {
      return 'low'; // Red for low battery
    }
  }
  
  ngOnInit(): void {

    console.log('Battery Percentage:', this.data.batteryPercentage);
    console.log('Is Charging:', this.data.isCharging); 
    this.setSignalStrength(this.data.SignalStrength)
  }
 
 
  onClose(): void {
    this.dialogRef.close();
  }

  setSignalStrength(signal: string): void {
    this.currentSignalClass = this.mapSignalToClass(signal);
    console.log('POpup Current Signal Class: ', this.currentSignalClass); 
  }

  mapSignalToClass(signal: string): string {
    switch (signal) {
      case 'No signal':
        return 'none';
      case 'Weak':
        return 'weak';
      case 'Medium':
        return 'medium';
      case 'Full':
        return 'full';
      case 'Searching':
        return 'loading';
      default:
        return 'loading';
    }
  }
}