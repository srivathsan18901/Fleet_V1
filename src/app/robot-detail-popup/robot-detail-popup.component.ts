import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProjectService } from '../services/project.service';
import { environment } from '../../environments/environment.development';
import { Subscription } from 'rxjs';

export interface Robot {
  isCharging: boolean;
  networksrength: any;
  currentMap: any;
  currentTask: any;
  batteryDistance: any;
  currentSpeed: any;
  averageSpeed: any;
  distanceLeft: string;
  isConnected : boolean;
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
  distance:number;
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
  isConnected: boolean = true;
  robotUtilization: string = '0';
  pick: any;
  specific : any;
  distance: any;

  toggleConnection() {
    console.log('toggle is clicked')
    this.data.isConnected=!this.data.isConnected;
    // console.log(this.data);
    this.isConnected = !this.isConnected;
  }
// active & Inactive
  isActive: boolean = false; // Initially true

  toggleStatus() {
    this.isActive = !this.isActive; // Toggle between true and false
  }

    // // Method to handle toggle
    // onToggle(event: Event): void {
    //   const checkbox = event.target as HTMLInputElement;
    //   this.isEmergencyStop = !checkbox.checked; // Toggle the state
    // }

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
    private projectService: ProjectService,
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
    this.selectedMap = this.projectService.getMapData();
    if (!this.selectedMap) {
      this.selectedMap = 'N/A';
      return;
    }
    this.pick = this.fetchChartData();
    this.specific = this.robotDetails();
    this.distance = this.fetchDistance();
    // console.log(this.specific,"=======================specific======================");
    // console.log(this.pick,"==========================pick===================");
    // console.log(this.distance,"======================distance=======================");
    let { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay();
    this.setSignalStrength(this.data.SignalStrength);
    // console.log(this.data,'data=========================')
    this.mapId = this.selectedMap.id;
    // console.log("dolu", this.mapId)
    this.populatedRobo();
    // console.log(this.populatedRobo)
    this.fetchLiveRobosData();
    this.projectService.getRobotUtilization(this.mapId, timeStamp1, timeStamp2).subscribe(
      (data) => {
        if (data && data.robots && data.robots.length > 0) {
          this.robotUtilization = data.robots[0].utilization_percentage;
        }
      },
      (error) => {
        console.error('Error fetching robot utilization:', error);
      }
    );
    // console.log(this.robotUtilization,"---------------robot utilization ------------");
   }
   truncateNumber(value: number): string {
    const numberString = value.toString();
    // Limit visible characters, truncate after a few digits and add '...'
    return numberString.length > 5 ? numberString.substring(0, 4) + '..' : numberString;
    }
  
   fetchChartData(): Promise<any> {
    const { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay();
    // console.log(timeSpan, 'time span robot');

    // Return a Promise to handle asynchronous behavior
    return fetch(
      `http://${environment.API_URL}:${environment.PORT}/get_pickdropCount`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeStamp1: timeStamp1,
          timeStamp2: timeStamp2,
        }),
      }
    ).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    });
  }

  fetchDistance(): Promise<any> {
    const { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay();
    // console.log(timeSpan, 'time span robot');

    // Return a Promise to handle asynchronous behavior
    return fetch(
      `http://${environment.API_URL}:${environment.PORT}/get_distance`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeStamp1: timeStamp1,
          timeStamp2: timeStamp2,
        }),
      }
    ).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    });
  }

  robotDetails(): Promise<any> {
    const { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay();
    // console.log(timeSpan, 'time span robot');

    // Return a Promise to handle asynchronous behavior
    return fetch(
      `http://${environment.API_URL}:${environment.PORT}/stream-data/get-live-robos/${this.selectedMap.id}`,
      {
        method: 'GET',
        credentials: 'include'
      }
    ).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    });
  }


   populatedRobo():void{
    fetch(`http://${environment.API_URL}:${environment.PORT}/robo-configuration/get-robos/${this.selectedMap.id}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => {
        // Handle the data
        console.log(data,"kjgiugjjgkklhktgiuhkn");
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
    console.log('POpup Current Signal Class: ', this.currentSignalClass);
  }

  getTimeStampsOfDay() {
    let currentTime = Math.floor(new Date().getTime() / 1000);
    let startTimeOfDay;
    if(this.currentFilter == 'week'){
       startTimeOfDay = this.weekStartOfDay()
    }
    else if(this.currentFilter == 'month'){
      startTimeOfDay = this.monthStartOfDay()
    }
    else{
      startTimeOfDay= this.getStartOfDay()
    }

    return {
      timeStamp1: startTimeOfDay,
      timeStamp2: currentTime,
    };
  }
  getStartOfDay() {
    return Math.floor(new Date().setHours(0, 0, 0) / 1000);
  }
  weekStartOfDay(){

    let currentDate = new Date();

    // Subtract 7 days (last week) from the current date
    let lastWeekDate = new Date();
    lastWeekDate.setDate(currentDate.getDate() - 7);

    return(Math.floor(new Date(lastWeekDate).setHours(0,0,0)/1000))
  }

  monthStartOfDay(){
    // Get the current date
    let currentDate = new Date();

    // Subtract 1 month from the current date
    let lastMonthDate = new Date();
    lastMonthDate.setMonth(currentDate.getMonth() - 1);
    return(Math.floor(new Date(lastMonthDate).setHours(0,0,0)/1000))
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
          if (robot && robot.robot_errors && robot.robot_errors['EMERGENCY STOP']) {
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

}
