import { Component, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProjectService } from '../services/project.service';
import { environment } from '../../environments/environment.development';
import { Subscription } from 'rxjs';
import { TranslationService } from '../services/translation.service';
import { Router } from '@angular/router';
import { NodeGraphService } from '../services/nodegraph.service';

export interface Robot {
  isCharging: boolean;
  networksrength: any;
  currentMap: any;
  currentTask: any;
  batteryDistance: any;
  currentSpeed: any;
  averageSpeed: any;
  distanceLeft: string;
  isConnected: boolean;
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
  cpuutilization: number;
  memory: string;
  PickCount: string;
  DropCount: string;
  SignalStrength: string;
  error: number;
  batteryPercentage: number;
  averagedischarge: number;
  averageChargingTime: string;
  currentspeed: string;
  averagespeed: string;
  maximumspeed: string;
  averagetransfertime: string;
  averagedockingtime: string;
  distance: number;
}

@Component({
  selector: 'app-robot-detail-popup',
  templateUrl: './robot-detail-popup.component.html',
  styleUrls: ['./robot-detail-popup.component.scss'],
})
export class RobotDetailPopupComponent {
  currentFilter: string = 'today'; // To track the selected filter
  metrics: { title: string; value: string; icon: string }[] = [];
  // batteryData: any[] = [];
  isEmergencyStop: boolean = false; // Default state is "run"
  private subscription!: Subscription;
  robot: any;
  currentSignalClass: any;
  selectedMap: any | null = null;
  mapId: any;
  robotUtilization: string = '0';

  // active & Inactive
  isActive: boolean = false; // Initially true

  constructor(
    public dialogRef: MatDialogRef<RobotDetailPopupComponent>,
    private projectService: ProjectService,
    private translationService: TranslationService,
    private router: Router,
    private nodeGraphService: NodeGraphService,
    @Inject(MAT_DIALOG_DATA) public data: Robot
  ) {}

  ngOnInit(): void {
    this.selectedMap = this.projectService.getMapData();
    if (!this.selectedMap) {
      this.selectedMap = 'N/A';
      return;
    }
    let { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay();
    this.setSignalStrength(this.data.SignalStrength);
    this.mapId = this.selectedMap.id;
    // this.populatedRobo(); // check it once..
    this.fetchLiveRobosData();
    this.projectService
      .getRobotUtilization(this.mapId, timeStamp1, timeStamp2)
      .subscribe(
        (data) => {
          if (data && data.robots && data.robots.length > 0) {
            this.robotUtilization = data.robots[0].utilization_percentage;
          }
        },
        (error) => {
          console.error('Error fetching robot utilization:', error);
        }
      );
  }

  toggleStatus() {
    this.isActive = !this.isActive; // Toggle between true and false
  }

  toggleConnection() {
    if (!this.data) return;
    // this.data.isConnected = !this.data.isConnected;
    if (this.data.isConnected) this.disConnectRobot(this.data.id);
    this.connectRobot(this.data.id);
  }

  localize() {
    this.nodeGraphService.setRoboToLocalize(this.data.id);
    this.nodeGraphService.setLocalize(true);
    this.nodeGraphService.setAssignTask(false);
    this.router.navigate(['/dashboard']);
    this.dialogRef.close();
  }

  connectRobotController: AbortController | null = null;
  disConnectRobotController: AbortController | null = null;

  async connectRobot(robotId: number): Promise<void> {
    if (this.connectRobotController) this.connectRobotController.abort();
    this.connectRobotController = new AbortController();
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/stream-data/connect-robot`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ robotId: robotId }),
        signal: this.connectRobotController.signal,
      }
    );

    let data = await response.json();
    if (data.error) return;
    if (data.isRobotConnected) this.data.isConnected = true;
  }

  async disConnectRobot(robotId: number): Promise<void> {
    if (this.disConnectRobotController) this.disConnectRobotController.abort();
    this.disConnectRobotController = new AbortController();
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/stream-data/disconnect-robot`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ robotId: robotId }),
        signal: this.disConnectRobotController.signal,
      }
    );

    let data = await response.json();
    if (data.error) return;
    if (data.isRobotDisconnected) this.data.isConnected = false;
  }

  onEmergencyStop() {
    alert('Emergency Stop Pressed!');
  }

  truncateValue(value: number): string {
    const valueString = value.toString(); // Convert number to string
    if (valueString.length > 3) {
      return valueString.slice(0, 3) + '...'; // Truncate and append '...'
    }
    return valueString; // Return the whole string if 3 or fewer digits
  }

  getClassForCircle(percentage: number, threshold: number): string {
    return percentage >= threshold ? 'filled' : '';
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

  get batteryPercentage(): number {
    return Number(this.data.batteryPercentage);
  }

  getTranslation(key: string) {
    return this.translationService.getRobotsTranslation(key);
  }

  truncateNumber(value: number): string {
    const numberString = value.toString();
    // Limit visible characters, truncate after a few digits and add '...'
    return numberString.length > 5
      ? numberString.substring(0, 4) + '..'
      : numberString;
  }

  populatedRobo(): void {
    fetch(
      `http://${environment.API_URL}:${environment.PORT}/robo-configuration/get-robos/${this.selectedMap.id}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    )
      .then((response) => response.json())
      .then((data) => {
        // Handle the data
        // console.log(data);
      })
      .catch((error) => {
        // Handle errors
        console.error('Error fetching robo configuration:', error);
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  setSignalStrength(signal: string): void {
    this.currentSignalClass = this.mapSignalToClass(signal);
  }

  getTimeStampsOfDay() {
    let currentTime = Math.floor(new Date().getTime() / 1000);
    let startTimeOfDay;
    if (this.currentFilter == 'week') {
      startTimeOfDay = this.weekStartOfDay();
    } else if (this.currentFilter == 'month') {
      startTimeOfDay = this.monthStartOfDay();
    } else {
      startTimeOfDay = this.getStartOfDay();
    }

    return {
      timeStamp1: startTimeOfDay,
      timeStamp2: currentTime,
    };
  }

  getStartOfDay() {
    return Math.floor(new Date().setHours(0, 0, 0) / 1000);
  }

  weekStartOfDay() {
    let currentDate = new Date();

    // Subtract 7 days (last week) from the current date
    let lastWeekDate = new Date();
    lastWeekDate.setDate(currentDate.getDate() - 7);

    return Math.floor(new Date(lastWeekDate).setHours(0, 0, 0) / 1000);
  }

  monthStartOfDay() {
    // Get the current date
    let currentDate = new Date();

    // Subtract 1 month from the current date
    let lastMonthDate = new Date();
    lastMonthDate.setMonth(currentDate.getMonth() - 1);
    return Math.floor(new Date(lastMonthDate).setHours(0, 0, 0) / 1000);
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

  // Fetch live robot data and check for "EMERGENCY STOP"
  fetchLiveRobosData(): void {
    const apiUrl = `http://${environment.API_URL}:${environment.PORT}/stream-data/get-live-robos/${this.selectedMap.id}`;

    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        const robot = data.robos?.robots?.[0];
        if (
          robot &&
          robot.robot_errors &&
          robot.robot_errors['EMERGENCY STOP']
        ) {
          this.isEmergencyStop = true; // Set to "Stop" if "EMERGENCY STOP" exists
        } else {
          this.isEmergencyStop = false; // Default to "Run"
        }
      })
      .catch((err) => {
        console.error('Error fetching live robos data:', err);
      });
  }

  // Method to handle toggle
  onToggle(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.isEmergencyStop = !checkbox.checked; // Toggle the state
    console.log(
      `Emergency Stop toggled to: ${this.isEmergencyStop ? 'Stop' : 'Run'}`
    );
  }

  ngOnDestroy() {
    if (this.connectRobotController) this.connectRobotController.abort();
    if (this.disConnectRobotController) this.disConnectRobotController.abort();
  }
}
