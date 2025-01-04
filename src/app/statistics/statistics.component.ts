import { ChangeDetectorRef, Component, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.development';
import { ProjectService } from '../services/project.service';
import { log } from 'console';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css'],
})
export class StatisticsComponent {
  products: any;
  fleetActivities: any;
  processedErrors: any;
  getSeverity(arg0: any) {
    throw new Error('Method not implemented.');
  }
  currentView: string = 'operation'; // Default to 'operation'
  operationPie: number[] = [0, 0, 0, 0, 0, 0];
  selectedMap: any | null = null;
  operationActivities: any[] = [];

  notifications: any[] = [];
  taskErrNotifications: any[] = [];

  statisticsData: any = {
    systemThroughput: 0,
    systemThroughputChange: 3.5,
    systemUptime: 0,
    systemUptimeChange: 0.2,
    successRate: 0,
    successRateChange: -1.5,
    responsiveness: 0,
    responsivenessChange: 5.2,
  }; // Initialize the array with mock data

  systemThroughput: number[] = [1, 2, 3, 4, 5];

  filteredOperationActivities = this.operationActivities;
  filteredNotifications = this.notifications;
  filteredTaskNotifications = this.taskErrNotifications;

  taskStatus_interval: any | null = null;
  currTaskStatus_interval: any | null = null;

  constructor(
    private router: Router,
    private projectService: ProjectService,
    private cdRef: ChangeDetectorRef
  ) {
    if (!this.selectedMap) this.selectedMap = this.projectService.getMapData();
  }

  onViewAllClick() {
    this.router.navigate(['/tasks']); // Navigate to tasks page
  }

  setView(view: string): void {
    this.currentView = view;
    if (view === 'robot') {
      this.router.navigate(['/statistics/robot']);
    } else {
      this.router.navigate(['/statistics/operation']);
    }
  }

  async ngOnInit() {
    this.router.navigate(['/statistics/operation']); // Default to operation view
    this.selectedMap = this.projectService.getMapData();
    if (!this.selectedMap) return;
    await this.getGrossStatus();
    this.operationPie = await this.fetchTasksStatus();
    await this.getTaskNotifications();
    this.taskStatus_interval = setInterval(async () => {
      this.operationPie = await this.fetchTasksStatus();
    }, 1000 * 10);
    this.operationActivities = await this.fetchCurrTasksStatus();
    this.filteredOperationActivities = this.operationActivities;
    this.currTaskStatus_interval = setInterval(async () => {
      let currTasks = await this.fetchCurrTasksStatus();
      this.filteredOperationActivities = currTasks;
    }, 1000 * 10);
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

  // not called anywhere..
  async getFleetLogStatus() {
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/stream-data/get-live-robos/${this.selectedMap.id}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );
    const data = await response.json();
    if (!data.map || data.error) return;
    this.fleetActivities = data.objs;
    if (!('objects' in this.fleetActivities)) return;
    let { objs }: any = this.fleetActivities;
    if (!objs.length) return;

    objs.forEach((robot: any) => {
      if (robot.fleet_errors) {
        for (const [errorType, errors] of Object.entries(robot.robot_errors)) {
          // [errorType, errors] => [key, value]
          // if (errorType === "NO ERROR") continue;
          for (let error of errors as any[]) {
            let err_type = [
              'EMERGENCY STOP',
              'LIDAR_ERROR',
              'DOCKING ERROR',
              'LOADING ERROR',
              'NO ERROR',
            ]; //Robot Errors List from RabbitMQ
            let criticality = 'Normal';

            if (
              err_type.includes(err_type[0]) ||
              err_type.includes(err_type[3])
            )
              criticality = 'Critical'; // "EMERGENCY STOP", "DOCKING"
            else if (
              err_type.includes(err_type[1]) ||
              err_type.includes(err_type[2])
            )
              criticality = 'Warning'; // "LIDAR_ERROR", "MANUAL MODE"

            let notificationKey = `${error.description} on robot ID ${robot.id}`;
            if (this.processedErrors?.has(notificationKey)) continue;
            this.processedErrors?.add(notificationKey);

            this.notifications.push({
              label: `${criticality}`,
              message: `${error.description} on robot ID ${robot.id}`,
              type:
                criticality === 'Critical'
                  ? 'red'
                  : criticality === 'Warning'
                  ? 'yellow'
                  : 'green',
            });

            this.cdRef.detectChanges(); // yet to notify..
          }
        }
      }
    });
  }

  async getTaskNotifications() {
    let establishedTime = new Date(this.selectedMap.createdAt);
    let { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay(establishedTime);
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/err-logs/task-logs/${this.selectedMap.id}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          // mapId: this.selectedMap.id,
          timeStamp1: timeStamp1,
          timeStamp2: timeStamp2,
        }),
      }
    );
    const data = await response.json();
    if (!data.map || data.error) return;
    this.taskErrNotifications = data.taskErr
      .map((err: any) => {
        if (!err) return null;
        let dateCreated = new Date(err.TaskAddTime * 1000);
        return {
          status: err.task_status.status,
          taskId: err.task_id,
          timestamp: dateCreated.toLocaleString(),
        };
      })
      .filter((err: any) => err !== null);
    this.filteredTaskNotifications = this.taskErrNotifications;
  }

  async getGrossStatus() {
    const mapId = this.selectedMap.id;
    const projectId = this.projectService.getSelectedProject()._id;

    let uptime = await this.fetchFleetStatus('system-uptime', {
      projectId: projectId,
    });
    if (uptime.systemUptime) {
      this.statisticsData.systemUptime = uptime.systemUptime;
    } else {
      this.statisticsData.systemUptime = 'Loading...';
    }
    // await this.fetchFleetStatus('success-rate', { // yet to take..
    //   mapId: mapId,
    // });
    // yet to uncomment..
    // if (successRate.successRate)
    //   this.statisticsData.successRate = successRate.successRate;
    // let responsiveness = await this.fetchFleetStatus('system-responsiveness', {
    //   mapId: mapId,
    // });
    // if (responsiveness.systemResponsiveness)
    //   this.statisticsData.responsiveness = responsiveness.systemResponsiveness;
  }

  async fetchCurrTasksStatus(): Promise<any[]> {
    let establishedTime = new Date(this.selectedMap.createdAt);
    let { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay(establishedTime);
    // timeStamp1 = 1728930600;
    // timeStamp2 = 1729050704;
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-tasks/curr-task-activities`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapId: this.selectedMap.id,
          timeStamp1: timeStamp1,
          timeStamp2: timeStamp2,
        }),
      }
    );
    // if(!response.ok) throw new Error(`Error occured with status code of : ${response.status}`)
    let data = await response.json();
    if (data.error) {
      console.log('Err occured while getting tasks status : ', data.error);
      return [];
    }

    if (data.tasks) {
      if (!('tasks' in data.tasks))
        return [
          { taskId: 'n/a', taskName: 'n/a', robotName: 'n/a', status: 'n/a' },
        ];
      let { tasks } = data.tasks;

      let tot_responsiveness = 0;

      let fleet_tasks = tasks.map((task: any) => {
        if (task.TaskAssignTime >= task.TaskAddTime) {
          tot_responsiveness += task.TaskAssignTime - task.TaskAddTime;
          // console.log("tot_responsiveness",tot_responsiveness );
        }

        return {
          taskId: task.task_id,
          taskName: task.sub_task[0]?.task_type
            ? task.sub_task[0]?.task_type
            : 'N/A',
          robotName: task.agent_ID, // agent_name
          status: task.task_status.status,
        };
      });
      let average_responsiveness = (tot_responsiveness / tasks.length) * 1000;
      this.statisticsData.responsiveness = `${Math.round(
        average_responsiveness / 1000
      )} s`;
      console.log('Responsiveness', Math.round(average_responsiveness));

      return fleet_tasks;
    }
    return [];
  }

  async fetchTasksStatus(): Promise<number[]> {
    let establishedTime = new Date(this.selectedMap.createdAt);
    let { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay(establishedTime); // yet to take, in seri..
    // timeStamp1 = 1728930600;
    // timeStamp2 = 1729050704;
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-tasks`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapId: this.selectedMap.id,
          timeStamp1: timeStamp1,
          timeStamp2: timeStamp2,
        }),
      }
    );
    // if(!response.ok) throw new Error(`Error occured with status code of : ${response.status}`)
    let data = await response.json();

    if (data.error) {
      console.log('Err occured while getting tasks status : ', data.error);
      return [0, 0, 0, 0, 0, 0];
    }
    if (!data.tasks?.tasks) return [0, 0, 0, 0, 0, 0];
    const { tasks } = data.tasks;
    // if (data.tasksStatus) return data.tasksStatus;
    // ["completed", "In-progress", "todo", "err", "cancelled"];
    let tasksStatus = [0, 0, 0, 0, 0, 0];
    let tot_tasks = 0;
    if (tasks) {
      let tasksStatusArr = tasks.map((task: any) => {
        return task.task_status.status;
      });
      for (let task of tasksStatusArr) {
        if (task === 'COMPLETED') tasksStatus[0] += 1;
        else if (task === 'ACCEPTED') tasksStatus[1] += 1;
        else if (
          task === 'INPROGRESS' ||
          task === 'DROPPED' ||
          task === 'PICKED'
        )
          tasksStatus[2] += 1;
        else if (task === 'NOTASSIGNED') tasksStatus[3] += 1;
        else if (task === 'FAILED' || task === 'REJECTED') tasksStatus[4] += 1;
        else if (task === 'CANCELLED') tasksStatus[5] += 1;
      }
      for (let taskStatus of tasksStatus) {
        tot_tasks += taskStatus;
      }
      let completedTasks = tasksStatus[0];
      let errorTasks = tasksStatus[4];
      let cancelledTasks = tasksStatus[5];
      if (
        completedTasks === 0 ||
        isNaN(completedTasks) ||
        isNaN(errorTasks) ||
        isNaN(cancelledTasks)
      ) {
        this.statisticsData.successRate = 'Loading...';
      } else {
        this.statisticsData.successRate = (
          (completedTasks / (completedTasks + errorTasks)) * 100 || 0
        ).toFixed(2);
      }
      return tasksStatus;
    }
    return [0, 0, 0, 0, 0, 0];
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    const query = input.value.toLowerCase();
    this.filteredOperationActivities = this.operationActivities.filter(
      (activity) =>
        activity.taskName.toLowerCase().includes(query) ||
        activity.taskId.toString().toLowerCase().includes(query) ||
        activity.robotName.toString().toLowerCase().includes(query) ||
        activity.status.toLowerCase().includes(query)
    );
  }

  onSearchNotifications(event: Event): void {
    const input = event.target as HTMLInputElement;
    const query = input.value.toLowerCase();
    this.filteredNotifications = this.notifications.filter((notification) =>
      notification.message.toLowerCase().includes(query)
    );
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

  updateSysThroughput(data: any) {
    // console.log("nan tha",data[data.length - 1]);
    if (data.length)
      this.statisticsData.systemThroughput = data[data.length - 1];
    else this.statisticsData.systemThroughput = 'Loading...';
  }

  ngOnDestroy() {
    if (this.taskStatus_interval) clearInterval(this.taskStatus_interval);
    if (this.currTaskStatus_interval)
      clearInterval(this.currTaskStatus_interval);
  }
}
