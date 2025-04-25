import {
  ChangeDetectorRef,
  Component,
  OnChanges,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.development';
import { ProjectService } from '../services/project.service';
import { IsFleetService } from '../services/shared/is-fleet.service';
import { Subscription } from 'rxjs';
import { TranslationService } from '../services/translation.service';
import { ExportFileService } from '../services/export-file.service';
import { AreaChartComponent } from '../area-chart/area-chart.component';
import { GradientDonutComponent } from '../gradient-donut/gradient-donut.component';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css'],
})
export class StatisticsComponent {
  @ViewChild(AreaChartComponent) areaChartComponent!: AreaChartComponent;
  @ViewChild(GradientDonutComponent)
  gradientDonutComponent!: GradientDonutComponent;
  products: any;
  fleetActivities: any;
  processedErrors: any;

  currentView: string = 'operation'; // Default to 'operation'
  operationPie: number[] = [0, 0, 0, 0, 0, 0];
  selectedMap: any | null = null;
  operationActivities: any[] = [];

  notifications: any[] = [];
  taskErrNotifications: any[] = [];
  isLive: boolean = false;

  isFleet: boolean = false;
  isFleetMode: boolean = false;
  isExpInProgress: boolean = false;

  isDataLoaded: boolean = false;

  statisticsData: any = {
    // systemThroughput: this.getTranslation('loading'),
    systemThroughputChange: 0,
    // systemUptime: this.getTranslation('loading'),
    systemUptimeChange: 0,
    // successRate: this.getTranslation('loading'),
    successRateChange: 0,
    // responsiveness: this.getTranslation('loading'),
    responsivenessChange: 0,
  }; // Initialize the array with mock data

  private subscriptions: Subscription[] = [];

  filteredOperationActivities = this.operationActivities;
  filteredNotifications = this.notifications;
  filteredTaskNotifications = this.taskErrNotifications;

  taskStatus_interval: any | null = null;
  currTaskStatus_interval: any | null = null;

  private abortControllers: Map<string, AbortController> = new Map();

  constructor(
    private router: Router,
    private projectService: ProjectService,
    private cdRef: ChangeDetectorRef,
    private isFleetService: IsFleetService,
    private translationService: TranslationService,
    private exportFileService: ExportFileService,
    private spinner: NgxSpinnerService
  ) {
    if (!this.selectedMap) this.selectedMap = this.projectService.getMapData();
  }

  async ngOnInit() {
    const fleetSub = this.projectService.isFleetUp$.subscribe((status) => {
      this.isFleet = status;
      this.cdRef.detectChanges();
      // console.log(status);
    });
    this.hasData();
    this.subscriptions.push(fleetSub);
    this.router.navigate(['/statistics/operation']); // Default to operation view
    this.selectedMap = this.projectService.getMapData();
    if (!this.selectedMap) {
      this.showAlert();
      return;
    }
    this.isLive = this.projectService.getInLive();
    // this.isFleetService.abortFleetStatusSignal(); // yet to notify..
    await this.getGrossStatus();

    if (this.isFleet) {
      this.operationPie = await this.fetchTasksStatus();
      this.exportFileService.taskData = this.operationPie;
      this.isDataLoaded = this.hasData();
    }

    if (this.isFleet) this.getTaskNotifications();

    this.taskStatus_interval = setInterval(async () => {
      if (this.isFleet) {
        this.operationPie = await this.fetchTasksStatus();
        this.exportFileService.taskData = this.operationPie;
        this.isDataLoaded = this.hasData();
      }
    }, 1000 * 5);

    this.operationActivities = await this.fetchCurrTasksStatus();
    this.filteredOperationActivities = this.operationActivities;

    this.currTaskStatus_interval = setInterval(async () => {
      if (this.isFleet) {
        let currTasks = await this.fetchCurrTasksStatus();
        this.filteredOperationActivities = currTasks;
        this.getTaskNotifications();
      }
    }, 1000 * 5);
  }

  showAlert() {
    setTimeout(() => {
      Swal.fire({
        position: 'center',
        icon: 'info',
        html: `<span style="font-size: 20px;">Select Map to view its Statistics !</span>`,
        showConfirmButton: true,
      });
    }, 250);
  }

  getSeverity(arg0: any) {
    throw new Error('Method not implemented.');
  }

  getTranslation(key: string) {
    return this.translationService.getStatisticsTranslation(key);
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

  getTaskTranslation(key: string) {
    return this.translationService.getTasksTranslation(key);
  }

  async fetchFleetStatus(endpoint: string, bodyData = {}): Promise<any> {
    if (this.abortControllers.has(endpoint))
      this.abortControllers.get(endpoint)?.abort();

    const abortController = new AbortController();
    this.abortControllers.set(endpoint, abortController);

    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-gross-status/${endpoint}`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
        signal: abortController.signal,
      }
    );

    return await response.json();
  }

  async createDocDefinition() {
    await this.areaChartComponent.fetchWholeGraph();
    this.exportFileService.donutChartBase64URI =
      await this.gradientDonutComponent.getChart();
  }

  async getTaskNotifications() {
    let establishedTime = new Date(); // this.selectedMap.createdAt
    let { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay(establishedTime);
    let endPoint = '/err-logs';

    if (this.abortControllers.has(endPoint))
      this.abortControllers.get(endPoint)?.abort();

    const abortController = new AbortController();
    this.abortControllers.set(endPoint, abortController);

    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/err-logs/${this.selectedMap.id}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'task',
          timeStamp1: timeStamp1,
          timeStamp2: timeStamp2,
        }),
        signal: abortController.signal,
      }
    );
    const data = await response.json();
    if (!data.map || data.error) return;

    const { errLogs } = data;

    this.taskErrNotifications = errLogs.map((error: any) => {
      // let dateCreated = new Date(error.timestamp * 1000);
      return {
        taskId: error.id,
        criticality: error.criticality,
        description: error.description,
      };
    });
    this.filteredTaskNotifications = this.taskErrNotifications;
  }

  async getGrossStatus() {
    const projectId = this.projectService.getSelectedProject()._id;

    let uptime = await this.fetchFleetStatus('system-uptime', {
      projectId: projectId,
    });
    if (uptime.systemUptime) {
      this.statisticsData.systemUptime = uptime.systemUptime;
      this.exportFileService.systemUptime = this.statisticsData.systemUptime;
    } else this.statisticsData.systemUptime = 'Loading...';
  }

  async fetchCurrTasksStatus(): Promise<any[]> {
    let establishedTime = new Date(); // this.selectedMap.createdAt
    let { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay(establishedTime);

    let endPoint = '/fleet-tasks/curr-task-activities';

    if (this.abortControllers.has(endPoint))
      this.abortControllers.get(endPoint)?.abort();

    const abortController = new AbortController();
    this.abortControllers.set(endPoint, abortController);

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
        signal: abortController.signal,
      }
    );
    // if(!response.ok) throw new Error(`Error occured with status code of : ${response.status}`)
    let data = await response.json();
    // console.log(data);

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
          taskType: task.task_type,
          robotName: task.agent_ID, // agent_name
          status: task.task_status.status,
        };
      });
      let average_responsiveness = (tot_responsiveness / tasks.length) * 1000;
      this.statisticsData.responsiveness = `${Math.round(
        average_responsiveness / 1000
      )} s`;
      this.exportFileService.responsiveness =
        this.statisticsData.responsiveness;

      return fleet_tasks;
    }
    return [];
  }

  async fetchTasksStatus(): Promise<number[]> {
    let startEstablishTime = new Date().setHours(0, 0, 0, 0);
    let establishedTime = new Date(startEstablishTime);

    let { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay(establishedTime); // yet to take, in seri..

    let endPoint = '/fleet-tasks';

    if (this.abortControllers.has(endPoint))
      this.abortControllers.get(endPoint)?.abort();

    const abortController = new AbortController();
    this.abortControllers.set(endPoint, abortController);

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
        signal: abortController.signal,
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

    // ["completed", "In-progress", "todo", "err", "cancelled"];
    let tasksStatus = [0, 0, 0, 0, 0, 0];
    let tot_tasks = 0;

    if (tasks) {
      let tasksStatusArr = tasks.map((task: any) => task.task_status.status);
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
      for (let taskStatus of tasksStatus) tot_tasks += taskStatus;
    }

    let completedTasks = tasksStatus[0];
    let errorTasks = tasksStatus[4];
    let cancelledTasks = tasksStatus[5];
    let inProgressTasks = tasksStatus[2];
    if (isNaN(completedTasks) || isNaN(errorTasks) || isNaN(cancelledTasks)) {
      this.statisticsData.successRate = 'Loading...';
    } else {
      this.statisticsData.successRate = (
        ((completedTasks + errorTasks + cancelledTasks) /
          (completedTasks + errorTasks + cancelledTasks + inProgressTasks)) *
          100 || 0
      ).toFixed(2);
      this.exportFileService.successRate = this.statisticsData.successRate;
    }
    return tasksStatus;
  }

  hasData(): boolean {
    return this.operationPie.some((value) => value > 0);
  }

  noData = 'fnvnvd';
  async generatePdf() {
    if (!this.isFleet) {
      alert('fleet is in down!');
      return;
    }
    this.isExpInProgress = true;
    this.spinner.show();
    await this.createDocDefinition();

    this.exportFileService.createDocument();
    this.isExpInProgress = false;
    this.spinner.hide();
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

  // hasData(): boolean {
  //   return this.operationPie.some((value) => value > 0);
  // }

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
    if (data.length) {
      this.statisticsData.systemThroughput = data[data.length - 1];
      this.exportFileService.systemThroughput =
        this.statisticsData.systemThroughput;
    } else this.statisticsData.systemThroughput = 'Loading...';
  }

  ngOnDestroy() {
    if (this.taskStatus_interval) clearInterval(this.taskStatus_interval);
    if (this.currTaskStatus_interval)
      clearInterval(this.currTaskStatus_interval);

    this.abortControllers.forEach((controller) => controller.abort()); // forEach(val, key, map/arr/..)
    this.abortControllers.clear();
  }
}
