import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RobotDetailPopupComponent } from '../robot-detail-popup/robot-detail-popup.component';
import { environment } from '../../environments/environment.development';
import { ProjectService } from '../services/project.service';

export interface Robot {
  id: number;
  name: string;
  imageUrl: string;
  status: string;
  battery: string;
  serialNumber: string;
  temperature: string; // Battery temperature field
  networkstrength: string;
  robotutilization: string;
  cpuutilization: string;
  memory: string;
  error: string;
  batteryPercentage: number;
  totalPicks: string;
  totalDrops: string;
  SignalStrength: string;
  isCharging: boolean; // This will control whether the icon is shown
  averagedischarge: number;
  averageChargingTime: string;
  currentspeed: string;
  averagespeed: string;
  maximumspeed: string;
  averagetransfertime: string;
  averagedockingtime: string;
  // Add other fields as needed
}

@Component({
  selector: 'app-robots',
  templateUrl: './robots.component.html',
  styleUrls: ['./robots.component.scss'],
})
export class RobotsComponent implements OnInit {
  robotImages: string[] = [
    'agv1.png',
    'agv2.png',
    'agv3.png',
    // Add more images from assets/robots
  ];
  currentSignalClass: string = 'none'; // Default class
  robots: Robot[] = [];

  /* robots: Robot[] = [
    {
    id: 1,
    serialNumber: '50000',
    name: 'Forklift AGV',
    imageUrl: '../../assets/robots/agv1.png',
    status: 'Active',
    battery: '40%',
    temperature: '59 C',
    networkstrength: '90 dBi',
    robotutilization: ' 43 %',
    cpuutilization: '90 %',
    memory: '10 %',
    error: '10',
    batteryPercentage: 77,
    isCharging: true, // This will control whether the icon is shown
    totalPicks: '31',
    totalDrops: '28',
    SignalStrength: 'Weak',
    averagedischarge:20,
    averageChargingTime:'1.30',
    currentspeed: '1.5',
    averagespeed: '0.9',
    maximumspeed: '2.0',
    averagetransfertime: '2.03',
    averagedockingtime: '1.40',
  },
    {
      id: 2,
      serialNumber: '101589',
      name: 'Forklift AGV',
      imageUrl: '../../assets/robots/agv1.png',
      status: 'Active',
      battery: '40%',
      temperature: '57 C',
      networkstrength: '80 dBi',
      robotutilization: ' 85 %',
      cpuutilization: '80 %',
      memory: '20 %',
      error: '20',
      batteryPercentage: 7,
      isCharging: true, // This will control whether the icon is shown
      totalPicks: '31',
      totalDrops: '28',
      SignalStrength: 'Searching',
    },
    {
      id: 3,
      serialNumber: '101589',
      name: 'Forklift AGV',
      imageUrl: '../../assets/robots/agv1.png',
      status: 'Active',
      battery: '40%',
      temperature: '01 C',
      networkstrength: '70 dBi',
      robotutilization: ' 90 %',
      cpuutilization: '70 %',
      memory: '30 %',
      error: '30',
      batteryPercentage: 10,
      isCharging: true, // This will control whether the icon is shown
      totalPicks: '31',
      totalDrops: '28',
      SignalStrength: 'Weak',
    },
    {
      id: 4,
      serialNumber: '101589',
      name: 'Forklift AGV',
      imageUrl: '../../assets/robots/agv1.png',
      status: 'Active',
      battery: '40%',
      temperature: '100 C',
      networkstrength: '60 dBi',
      robotutilization: ' 60 %',
      cpuutilization: '60 %',
      memory: '40 %',
      error: '40',
      batteryPercentage: 40,
      isCharging: true, // This will control whether the icon is shown
      totalPicks: '31',
      totalDrops: '28',
      SignalStrength: 'Full',
    },
    {
      id: 5,
      serialNumber: '101589',
      name: 'Forklift AGV',
      imageUrl: '../../assets/robots/agv1.png',
      status: 'Active',
      battery: '40%',
      temperature: '55 C',
      networkstrength: '50 dBi',
      robotutilization: ' 40 %',
      cpuutilization: '50 %',
      memory: '50 %',
      error: '50',
      batteryPercentage: 41,
      isCharging: true, // This will control whether the icon is shown
      totalPicks: '31',
      totalDrops: '28',
      SignalStrength: 'Full',
    },
    {
      id: 6,
      serialNumber: '101589',
      name: 'Forklift AGV',
      imageUrl: '../../assets/robots/agv1.png',
      status: 'Active',
      battery: '40%',
      temperature: '55 C',
      networkstrength: '90 dBi',
      robotutilization: ' 23 %',
      cpuutilization: '40 %',
      memory: '60 %',
      error: '60',
      batteryPercentage: 90,
      isCharging: false, // This will control whether the icon is shown
      totalPicks: '31',
      totalDrops: '28',
      SignalStrength: 'Full',
    },
    // Add more robots...
  ]; */

  mapDetails: any | null = null;
  showPopup = false;
  isEditPopupOpen = false;
  menuOpenIndex: number | null = null;

  constructor(
    public dialog: MatDialog,
    private projectService: ProjectService
  ) {
    // this.mapDetails = this.projectService.getMapData();
  }

  async ngOnInit() {
    // this.setSignalStrength('Weak'); // Change this value to test different signals
    this.mapDetails = this.projectService.getMapData();
    if (!this.mapDetails) return;
    let grossFactSheet = await this.fetchAllRobos();
    this.robots = grossFactSheet.map((robo) => {
      robo.imageUrl = '../../assets/robots/agv1.png';
      if (robo.networkstrength < 20) robo.SignalStrength = 'Weak';
      else if (robo.networkstrength < 40) robo.SignalStrength = 'Medium';
      else if (robo.networkstrength < 80) robo.SignalStrength = 'Full';
      robo.networkstrength = robo.networkstrength.toString() + ' dBm';
      return robo;
    });
    // this.robots = grossFactSheet;
  }

  async fetchAllRobos(): Promise<any[]> {
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/stream-data/get-fms-amrs`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapId: this.mapDetails.id,
        }),
      }
    );
    // if (!response.ok)
    //   throw new Error(`Err with status code of ${response.status}`);
    const data = await response.json();
    console.log(data);
    if (data.robots) return data.robots;
    return [];
  }

  getImagePath(imageName: string): string {
    return `../../assets/robots/${imageName}`;
  }

  editIndex: number | null = null;
  centerIndex: any;

  togglePopup() {
    this.showPopup = !this.showPopup;
  }

  toggleMenu(index: number) {
    console.log('Toggling menu for index:', index); // Debugging log
    if (this.menuOpenIndex === index) {
      this.menuOpenIndex = null;
    } else {
      this.menuOpenIndex = index;
    }
  }

  closeMenu() {
    this.menuOpenIndex = null;
  }

  // addRobot() {
  //   if (this.newRobot.name && this.newRobot.imageUrl && this.newRobot.serialNumber && this.newRobot.status && this.newRobot.battery) {
  //     this.newRobot.id = this.robots.length > 0 ? this.robots[this.robots.length - 1].id + 1 : 1;
  //     this.robots.push({ ...this.newRobot });
  //     this.newRobot = { id: 0, name: '', imageUrl: '',  serialNumber: '',  status: 'Active', battery: '100%' };
  //     this.togglePopup();
  //   } else {
  //     alert('Please fill out all fields.');
  //   }
  // }

  // editRobot(index: number) {
  //   this.isEditPopupOpen = true;
  //   this.editIndex = index;
  //   this.editRobotData = { ...this.robots[index] };
  //   this.menuOpenIndex = null;
  // }

  // saveRobot() {
  //   if (this.editIndex !== null) {
  //     this.robots[this.editIndex] = {
  //       id: this.editRobotData.id,
  //       name: this.editRobotData.name,
  //       imageUrl: this.editRobotData.imageUrl,
  //       serialNumber: this.editRobotData.serialNumber || 'DefaultSerialNumber',

  //       status: this.editRobotData.status,
  //       battery: this.editRobotData.battery,

  //     };
  //     this.closeEditPopup();
  //   }
  // }

  // closeEditPopup() {
  //   this.isEditPopupOpen = false;
  //   this.editIndex = null;
  //   this.editRobotData = {
  //     id: 0,
  //     name: '',
  //     imageUrl: '',
  //     serialNumber: '' ,
  //     status: 'Active',
  //     battery: '100%',

  //   };
  // }

  deleteRobot(index: number) {
    // yet to do..
    // this.robots.splice(index, 1);
    this.updateRobotIds();
    this.menuOpenIndex = null;
  }

  updateRobotIds() {
    // this.robots.forEach((robot, index) => {
    //   robot.id = index + 1;
    // });
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  openRobotDetail(robot: Robot): void {
    this.dialog.open(RobotDetailPopupComponent, {
      width: '70%',
      data: robot,
    });
  }
  // fetchSignalStrength(): void {
  //   // Replace with your API endpoint
  //   const apiUrl = 'https://api.example.com/signal-strength';

  //   this.http.get<{ signal: string }>(apiUrl).subscribe(response => {
  //     this.currentSignalClass = this.mapSignalToClass(response.signal);
  //   });
  // }
  setSignalStrength(signal: string): void {
    this.currentSignalClass = this.mapSignalToClass(signal);
    console.log('Current Signal Class: ', this.currentSignalClass); // Debug log
  }

  mapSignalToClass(signal: string): string {
    switch (signal) {
      case 'no signal':
        return 'none';
      case 'weak':
        return 'weak';
      case 'medium':
        return 'medium';
      case 'full':
        return 'full';
      case 'searching':
        return 'loading';
      default:
        return 'loading';
    }
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
}
