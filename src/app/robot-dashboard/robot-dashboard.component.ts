import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from '../services/project.service';
import { environment } from '../../environments/environment.development';
import { interval } from 'rxjs';

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
  statisticsData: any = {
    averageSpeed: 0,
    averageSpeedchange: 8.5,
    totalDistance: 99.9,
    totalDistanceChange: 0.2,
    robotUtilization: 0,
    robotUtilizationChange: -1.5,
    networkConnection: 100,
    networkConnectionChange: 5.2,
  }; // Initialize the array with mock data

  // robotActivities = [

  //   // { id: 2, name: 'AMR-001', task: 'Transporting materials', progress: 85, status: 'Actively Working' },
  // ];

  notifications = [
    {
      message: 'Low Battery',
      taskId: 'AMR-001',
      timestamp: '2024-08-16 14:32',
    },
    {
      message: 'Task Assigned ',
      taskId: ' AMR-002',
      timestamp: '2024-08-16 14:32',
    },
    {
      message: 'Obstacle Detected ',
      taskId: ' AMR-003',
      timestamp: '2024-08-16',
    },
    {
      message: 'Low Battery',
      taskId: 'AMR-001',
      timestamp: '2024-08-16 14:32',
    },
    {
      message: 'Task Assigned ',
      taskId: ' AMR-002',
      timestamp: '2024-08-16 14:32',
    },
    {
      message: 'Obstacle Detected ',
      taskId: ' AMR-003',
      timestamp: '2024-08-16',
    },
    {
      message: 'Low Battery',
      taskId: 'AMR-001',
      timestamp: '2024-08-16 14:32',
    },
    {
      message: 'Task Assigned ',
      taskId: ' AMR-002',
      timestamp: '2024-08-16 14:32',
    },
    {
      message: 'Obstacle Detected ',
      taskId: ' AMR-003',
      timestamp: '2024-08-16',
    },
    {
      message: 'Low Battery',
      taskId: 'AMR-001',
      timestamp: '2024-08-16 14:32',
    },
    {
      message: 'Task Assigned ',
      taskId: ' AMR-002',
      timestamp: '2024-08-16 14:32',
    },
    {
      message: 'Obstacle Detected ',
      taskId: ' AMR-003',
      timestamp: '2024-08-16',
    },
    
    // { message: 'Obstacle Detected - AMR-003', timestamp: '2024-08-16' },
  ];

  filteredRobotActivities = this.robotActivities;
  filteredNotifications = this.notifications;

  constructor(private router: Router, private projectService: ProjectService) {}

  async ngOnInit() {
    this.router.navigate(['/statistics/robot']);
    this.selectedMap = this.projectService.getMapData();
    if (!this.selectedMap) return;
    this.robotActivities = await this.getLiveRoboInfo();
    this.updateLiveRoboInfo();
    this.filteredRobotActivities = this.robotActivities;
    this.getFleetGrossStatus();
    setInterval(async () => {
      this.robotActivities = await this.getLiveRoboInfo();
      this.updateLiveRoboInfo();
      this.filteredRobotActivities = this.robotActivities;
      // this.filteredRobotActivities = this.robotActivities.flat(); // flat() to convert nested of nested array to single array..
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

  // async to synchronous...
  async getFleetGrossStatus() {
    const mapId = this.selectedMap.id;

    let averageSpeed = this.getAvgSpeed();
    this.statisticsData.averageSpeed = averageSpeed;

    let totDistance = await this.fetchFleetStatus('total-distance', {
      mapId: mapId,
    });
    // console.log(totDistance,"totDistance")
    if (totDistance.totalDistance)
      this.statisticsData.totalDistance = totDistance.totalDistance;

    // let roboUtil = await this.fetchFleetStatus('robo-util', {
    //   mapId: mapId,
    // });
    // if (roboUtil.roboUtilization)
    //   this.statisticsData.robotUtilization = roboUtil.roboUtilization;

    let networkConn = await this.fetchFleetStatus('network-conn', {
      mapId: mapId,
    });
    // console.log(networkConn,"networkConn")
    if (networkConn.networkConnection)
      this.statisticsData.networkConnection = networkConn.networkConnection;
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
    let roboNotIdle = ["MOVESTATE", "DOCKSTATE", "UNDOCKSTATE", "LOADSTATE", "UNLOADSTATE"]

    this.robotActivities = robots.map((robo: any) => {
      if (roboNotIdle.includes(robo.robot_state)) tot_robotUtilization += 1;
      return {
        roboId: robo.id,
        task: robo.current_task,
        status: robo.isConnected ? 'ACTIVE' : 'INACTIVE',
        state: robo.robot_state,
      };
    });
    this.statisticsData.robotUtilization = `${(tot_robotUtilization / robots.length) * 100} %`;
    this.filteredRobotActivities = this.robotActivities;
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
      notification.message.toLowerCase().includes(query)
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

  ngAfterViewInit(){
      let reloadData=interval(2000).subscribe(()=>{
        this.getFleetGrossStatus()
      })
  }

  getAvgSpeed(): string{
    if (!('robots' in this.robotActivities)) return `${0} m/s`;

    let { robots }: any = this.robotActivities;
    if (!robots.length) return `${0} m/s`;

    let tot_speed = 0;
    for (let i = 0; i < robots.length; i++){
      tot_speed += robots[i].Speed;
    }

    return `${tot_speed/robots.length} m/s`;
  }
}


