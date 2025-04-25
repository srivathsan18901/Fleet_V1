import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from '../services/project.service';
import { environment } from '../../environments/environment.development';
import { interval } from 'rxjs';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-robot-dashboard',
  templateUrl: './robot-dashboard.component.html',
  styleUrls: ['./robot-dashboard.component.css'],
})
export class RobotDashboardComponent implements OnInit {
  currentView: string = 'robot';
  selectedMap: any | null = null;
  robotActivities: any[] = [];
  liveRobos: any[] = [];

  processedErrors: Set<string>;

  statisticsData: any = {
    averageSpeed: 0,
    averageSpeedchange: 8.5,
    totalDistance: 0,
    totalDistanceChange: 0.2,
    robotUtilization: 0,
    robotUtilizationChange: -1.5,
    networkConnection: 0,
    networkConnectionChange: 5.2,
  }; // Initialize the array with mock data

  notifications: any[] = [];

  filteredRobotActivities = this.robotActivities;
  filteredNotifications = this.notifications;

  roboDetInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private router: Router,
    private projectService: ProjectService,
    private cdRef: ChangeDetectorRef,
    private translationService: TranslationService
  ) {
    this.processedErrors = new Set<string>();
  }
  getTranslation(key: string) {
    return this.translationService.getStatisticsTranslation(key);
  }
  async ngOnInit() {
    this.router.navigate(['/statistics/robot']);
    this.selectedMap = this.projectService.getMapData();
    if (!this.selectedMap) return;
    this.robotActivities = await this.getLiveRoboInfo();
    this.getErrorLogs(); // update only err, warning..
    this.updateLiveRoboInfo();
    this.filteredRobotActivities = this.robotActivities;
    // this.getFleetGrossStatus();
    this.roboDetInterval = setInterval(async () => {
      this.robotActivities = await this.getLiveRoboInfo();
      this.getErrorLogs(); // update only err, warning..
      this.updateLiveRoboInfo();
      this.filteredRobotActivities = this.robotActivities;
    }, 1000 * 5);
  }

  async fetchFleetStatus(endpoint: string, bodyData = {}): Promise<any> {
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-gross-status/${endpoint}`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      }
    );
    return await response.json();
  }

  async getLiveRoboInfo(): Promise<any[]> {
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/stream-data/get-live-robos/${this.selectedMap.id}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const data = await response.json();
    // console.log(data);
    if (!data.map || data.error) return [];
    return data.robos;
  }

  errLogController: AbortController | null = null;

  async getErrorLogs(): Promise<void> {
    let { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay(new Date()); // this.selectedMap.createdAt

    if (this.errLogController) this.errLogController.abort();
    this.errLogController = new AbortController();

    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/err-logs/${this.selectedMap.id}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'robot',
          timeStamp1: timeStamp1,
          timeStamp2: timeStamp2,
        }),
        signal: this.errLogController.signal,
      }
    );
    const data = await response.json();

    if (!data.map || data.error) return;

    const { errLogs } = data;
    // console.log(errLogs);

    this.notifications = errLogs.map((error: any) => {
      // let dateCreated = new Date(error.timestamp * 1000);
      return {
        roboId: error.id,
        criticality: error.criticality,
        description: error.description,
      };
    });

    this.filteredNotifications = this.notifications;
  }

  getTimeStampsOfDay(establishedTime: Date) {
    let currentTime = Math.floor(new Date().getTime() / 1000);
    let startTimeOfDay = this.getStartOfDay(establishedTime);
    return {
      timeStamp1: startTimeOfDay,
      timeStamp2: currentTime,
    };
  }

  getStartOfDay(establishedTime: Date) {
    return Math.floor(establishedTime.setHours(0, 0, 0) / 1000);
  }

  // Clear all notifications when the button is clicked
  clearAllNotifications() {
    this.notifications = [];
    this.processedErrors.clear();
  }

  updateLiveRoboInfo() {
    if (!('robots' in this.robotActivities)) {
      // this.robots = this.initialRoboInfos;
      return;
    }
    let { robots }: any = this.robotActivities;
    if (!robots.length) {
      // this.robots = this.initialRoboInfos;
      return;
    }

    let tot_robotUtilization = 0;
    let tot_Dis = 0;
    let tot_Network = 0;
    let tot_speed = 0;
    let roboNotIdle = [
      'MOVESTATE',
      'DOCKSTATE',
      'UNDOCKSTATE',
      'LOADSTATE',
      'UNLOADSTATE',
    ];

    this.robotActivities = robots.map((robo: any) => {
      if (roboNotIdle.includes(robo.robot_state)) tot_robotUtilization += 1;
      tot_Dis += robo.DISTANCE;
      tot_Network += robo.NetworkSpeed;
      tot_speed += robo['Robot Speed'];
      return {
        roboId: robo.id,
        task: robo.current_task,
        status: robo.isConnected ? 'ACTIVE' : 'INACTIVE',
        state: robo.robot_state,
        criticality: robo.Criticality,
      };
    });
    this.statisticsData.robotUtilization = `${(
      (tot_robotUtilization / robots.length) *
      100
    ).toFixed(2)} %`;
    // tot_robotUtilization && robots.length
    // ? `${((tot_robotUtilization / robots.length) * 100).toFixed(2)} %`
    // : "Loading...";

    this.statisticsData.totalDistance = `${(tot_Dis / robots.length).toFixed(
      1
    )} m`;
    // tot_Dis && robots.length
    // ? `${(tot_Dis / robots.length).toFixed(2)} m`
    // : "Loading...";

    this.statisticsData.networkConnection = `${(
      tot_Network / robots.length
    ).toFixed(2)} dBm`;
    // tot_Network && robots.length
    // ? `${(tot_Network / robots.length).toFixed(2)} dBm`
    // : "Loading...";

    this.statisticsData.averageSpeed = `${(tot_speed / robots.length).toFixed(
      2
    )} m/s`;
    // tot_speed && robots.length
    // ? `${(tot_speed / robots.length).toFixed(2)} m/s`
    // : "Loading...";

    // this.filteredRobotActivities = this.robotActivities; // yet to uncomment if not workin case..
  }

  updateRoboActivities() {} // yet to use.. in case of dynamic update

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    const query = input.value.toLowerCase();
    this.filteredRobotActivities = this.robotActivities.filter(
      (activity) =>
        activity.roboId.toString().toLowerCase().includes(query) ||
        activity.state.toLowerCase().includes(query) ||
        activity.task.toLowerCase().includes(query)
    );
  }

  onSearchNotifications(event: Event): void {
    const input = event.target as HTMLInputElement;
    const query = input.value.toLowerCase();
    this.filteredNotifications = this.notifications.filter((notification) =>
      notification.errorName.toLowerCase().includes(query)
    );
  }

  setView(view: string): void {
    this.currentView = view;
    if (view === 'robot') {
      this.router.navigate(['/statistics/robot']);
    } else {
      this.router.navigate(['/statistics/operation']);
    }
  }

  onViewAllClick() {
    this.router.navigate(['/robot logs']); // Navigate to the tasks page
  }

  ngAfterViewInit() {
    // let reloadData=interval(2000).subscribe(()=>{
    //   this.getFleetGrossStatus()
    // })
  }

  ngOnDestroy() {
    if (this.roboDetInterval) clearInterval(this.roboDetInterval);
  }
}
