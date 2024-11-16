import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RobotDetailPopupComponent } from '../robot-detail-popup/robot-detail-popup.component';
import { environment } from '../../environments/environment.development';
import { ProjectService } from '../services/project.service';
import { Router, NavigationStart } from '@angular/router';
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
  cpuutilization: string;
  memory: string;
  totalPicks: string;
  totalDrops: string;
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
  // robots: any[] = [];
  liveRobos: any[] = [];
  searchQuery: string = ''; // To hold the search input
  filteredRobots: Robot[] = []; // To store filtered robots
  initialRoboInfos: Robot[] = []; // to store data of initial robo details..
  mapDetails: any | null = null;
  showPopup = false;
  menuOpenIndex: number | null = null;
  editIndex: number | null = null;
  centerIndex: any;

  private routerSubscription: Subscription | undefined; // Subscription to track navigation changes

  constructor(
    public dialog: MatDialog,
    private projectService: ProjectService,
    private router: Router // Inject Router
  ) {}

  async ngOnInit() {
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

    this.filteredRobots = this.robots;
    this.initialRoboInfos = this.robots;
    this.liveRobos = await this.getLiveRoboInfo();
    this.updateLiveRoboInfo();
    setInterval(async () => {
      this.liveRobos = await this.getLiveRoboInfo();
      this.updateLiveRoboInfo();
    }, 1000 * 5);

    // Subscribe to route changes to close popup on navigation
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.dialog.closeAll(); // Close all open dialogs when navigation starts
      }
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe from router events to prevent memory leaks
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  // Fetch robots from the API
  async fetchAllRobos(): Promise<any[]> {
    const response = await fetch(`http://${environment.API_URL}:${environment.PORT}/stream-data/get-fms-amrs`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mapId: this.mapDetails.id })
    });                          
           
    const data = await response.json();
    return data.robots || [];
  }

  async getLiveRoboInfo(): Promise<any[]> {
    const response = await fetch(`http://${environment.API_URL}:${environment.PORT}/stream-data/get-live-robos/${this.mapDetails.id}`, {
      method: 'GET',
      credentials: 'include'
    });

    const data = await response.json();
    if (!data.map || data.error) return [];
    return data.robos;
  }

  updateLiveRoboInfo() {
    if (!('robots' in this.liveRobos)) {
      this.robots = this.initialRoboInfos;
      return;
    }

//Robotstatus
                  
    let { robots }: any = this.liveRobos;
    if (!robots.length) this.robots = this.initialRoboInfos;
    this.robots = this.robots.map((robo) => {
      robots.forEach((liveRobo: any) => {
        if (robo.id == liveRobo.id) {
          robo.error = 0;
          robo.battery = liveRobo.battery.toFixed(2);
          robo.batteryPercentage = liveRobo.battery.toFixed(2);
          robo.currentTask = liveRobo.current_task;
          robo.status = liveRobo.isConnected ? 'ACTIVE' : 'INACTIVE';
          robo.isConnected = liveRobo.isConnected;

          if ('EMERGENCY STOP' in liveRobo.robot_errors)
            robo.error += liveRobo.robot_errors['EMERGENCY STOP'].length;
          if ('LIDAR_ERROR' in liveRobo.robot_errors)
            robo.error += liveRobo.robot_errors['LIDAR_ERROR'].length;
        }
      });
      return robo;
    });

    this.filteredRobots = this.robots;                   
  }

  openRobotDetail(robot: Robot): void {
    this.dialog.open(RobotDetailPopupComponent, {
      width: '50%',
      data: robot,
    });
  }

  filterRobots(): void {
    const query = this.searchQuery.toLowerCase();

    this.filteredRobots = this.robots.filter((robot) => {
      const idMatch = robot.id.toString().includes(query);
      const serialNumberMatch = robot.serialNumber.toLowerCase().includes(query);
      const nameMatch = robot.name.toLowerCase().includes(query);

      return idMatch || serialNumberMatch || nameMatch;
    });
  }

  getImagePath(imageName: string): string {
    return `../../assets/robots/${imageName}`;
  }

  togglePopup() {
    this.showPopup = !this.showPopup;
  }

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
    if (batteryPercentage >= 20) {
      return 'high'; // Green for high battery
    } else if (batteryPercentage >= 40) {
      return 'medium';
    } else {
      return 'low'; // Red for low battery
    }
  }
}
