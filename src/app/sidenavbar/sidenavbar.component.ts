import {
  Component,
  OnInit,
  ElementRef,
  HostListener,
  Renderer2,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';

import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ProjectService } from '../services/project.service';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../../environments/environment.development';
import { UserPermissionService } from '../services/user-permission.service';

@Component({
  selector: 'app-sidenavbar',
  templateUrl: './sidenavbar.component.html',
  styleUrls: ['./sidenavbar.component.css'],
})
export class SidenavbarComponent implements OnInit {
  username: string | null = null;
  userrole: string | null = null;
  robotActivities: any[] = [];
  fleetActivities: any[] = [];
  selectedMap: any | null = null;

  showNotificationPopup = false; // Property to track popup visibility
  showProfilePopup = false;
  isSidebarEnlarged = false; // Property to track sidebar enlargement
  cookieValue: any;

  isNotificationVisible = false;
  languageArrowState = false;
  isFleetUp: boolean = false; // Set to true or false based on your logic
  isAmqpUp: boolean = false;

  private autoCloseTimeout: any;
  notifications: any[] = [];

  processedErrors: Set<string>; // To track processed errors

  filteredRobotActivities = this.robotActivities;
  filteredNotifications = this.notifications;
  userManagementData: any;

  fleetStatusInterval: ReturnType<typeof setInterval> | null = null;
  notificationInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private projectService: ProjectService,
    private userPermissionService: UserPermissionService,
    private eRef: ElementRef,
    private cookieService: CookieService,
    private cdRef: ChangeDetectorRef
  ) {
    this.userManagementData = this.userPermissionService.getPermissions();
    this.processedErrors = new Set<string>(); // yet to noify later..
  }

  async ngOnInit() {
    // this.userManagementData= this.userPermissionService.getPermissions();
    const user = this.authService.getUser();
    if (user) {
      this.username = user.name;
      this.userrole = user.role;
    }
    this.cookieValue = JSON.parse(this.cookieService.get('_user'));
    this.selectedMap = this.projectService.getMapData();
    await this.getFleetStatus();
    this.fleetStatusInterval = setInterval(async () => {
      await this.getFleetStatus();
    }, 1000 * 2); // max to 30 or 60 sec
    if (!this.selectedMap) return;
    await this.getRoboStatus();
    await this.getTaskErrs();
    this.notificationInterval = setInterval(async () => {
      await this.getRoboStatus();
      await this.getTaskErrs(); // or run in indivdual..
    }, 1000 * 5); // max to 30 or 60 sec
  }

  async getFleetStatus() {
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/stream-data/get-fleet-status`
    );
    let data = await response.json();
    // console.log(data.fleetUp);
    this.isFleetUp = data.fleetUp ? true : false;
    let project = this.projectService.getSelectedProject();
    if (project && project._id) {
      let rabbitResponse = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/stream-data/rabbitmq-status/${project._id}`
      );

      let rabbitData = await rabbitResponse.json();

      this.isAmqpUp = rabbitData.rabbitmqStatus ? true : false;
    }

    let prevFleetStatus = this.projectService.getIsFleetUp();
    if (prevFleetStatus === (this.isFleetUp && this.isAmqpUp)) return;
    this.projectService.setIsFleetUp(this.isFleetUp && this.isAmqpUp);
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

  async getRoboStatus(): Promise<void> {
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/stream-data/get-live-robos/${this.selectedMap.id}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const data = await response.json();
    // console.log(data);
    if (!data.map || data.error) return;
    this.robotActivities = data.robos;

    if (!('robots' in this.robotActivities)) return;

    let { robots }: any = this.robotActivities;
    if (!robots.length) return;

    robots.forEach((robot: any) => {
      if (robot.robot_errors) {
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

    // console.log(this.notifications, this.processedErrors?.values());
  }

  async getTaskErrs(): Promise<void> {
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
    for (let err of data.taskErr) {
      if (err === null) continue;
      // let dateCreated = new Date(err.TaskAddTime * 1000);
      // {
      //   status: err.task_status.status,
      //   taskId: err.task_id,
      //   timestamp: dateCreated.toLocaleString()
      // }
      let notificationKey = `${err.task_status.status} on task ID ${err.task_id}`;
      if (this.processedErrors?.has(notificationKey)) continue;
      this.processedErrors?.add(notificationKey);
      let criticality = 'Normal';

      if (err.Error_code == 'HIGH') criticality = 'Critical';
      // else if(err.Error_code == "")
      //   criticality = "Warning";

      this.notifications.push({
        label: `${criticality}`,
        message: `${err.task_status.status} on task ID ${err.task_id}`,
        type:
          criticality === 'Critical'
            ? 'red'
            : criticality === 'Warning'
            ? 'yellow'
            : 'green',
      });
    }
  }

  // Clear all notifications when the button is clicked
  clearAllNotifications() {
    this.notifications = [];
    this.processedErrors.clear();
  }

  getNotificationClass(type: string): string {
    switch (type) {
      case 'red':
        return 'alert-red';
      case 'yellow':
        return 'alert-yellow';
      case 'green':
        return 'alert-green';
      default:
        return '';
    }
  }

  // This will listen for clicks on the entire document
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    // Check if the click is outside the notification popup
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.closePopup();
    }
  }

  toggleNotificationPopup() {
    this.showNotificationPopup = !this.showNotificationPopup;
  }
  // Function to show the notification popup
  showNotification() {
    this.isNotificationVisible = true;
    this.languageArrowState = false;
    this.showProfilePopup = false;
    this.startAutoClose(); // Start auto-close timer when popup is shown
  }

  // Function to close the notification popup
  closeNotification() {
    this.isNotificationVisible = false;
    this.clearAutoClose(); // Clear the timer if manually closed
  }

  // Start the auto-close after 5 seconds
  startAutoClose() {
    this.clearAutoClose(); // Clear any existing timer
    this.autoCloseTimeout = setTimeout(() => {
      this.closePopup();
      this.languageArrowState = false;
    }, 5000); // 5 seconds
  }

  // Cancel auto-close when the mouse is over the popup
  cancelAutoClose() {
    this.clearAutoClose();
  }

  // Clear the auto-close timeout
  clearAutoClose() {
    if (this.autoCloseTimeout) {
      clearTimeout(this.autoCloseTimeout);
      this.autoCloseTimeout = null;
    }
  }

  closePopup() {
    this.languageArrowState = false;
    this.showProfilePopup = false;
    this.isNotificationVisible = false;
  }

  toggleProfilePopup() {
    this.showProfilePopup = !this.showProfilePopup;
    this.isNotificationVisible = false;
    this.languageArrowState = false;
  }

  toggleSidebar(isEnlarged: boolean) {
    this.isSidebarEnlarged = isEnlarged;
  }
  showLogoutConfirmation = false;
  logout() {
    fetch(`http://${environment.API_URL}:${environment.PORT}/auth/logout`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.isCookieDeleted) {
          this.projectService.clearProjectData();
          this.projectService.clearMapData();
          this.projectService.clearIsMapSet();
          this.authService.logout();
          this.userPermissionService.deletePermissions();
          this.router.navigate(['/']);
        }
      })
      .catch((err) => console.log(err));
  }

  // language
  flags = [];

  trackFlag(index: number, flag: any): number {
    return flag.order; // Use the unique identifier for tracking
  }

  languageChange() {
    this.languageArrowState = !this.languageArrowState;
    this.isNotificationVisible = false;
    this.showProfilePopup = false;
  }

  // flagSvg = this.flags[0].flagComp;
  // flagName = this.flags[0].nameTag;

  changeFlag(order: number) {
    // this.flagSvg = this.flags[order].flagComp;
    // this.flagName = this.flags[order].nameTag;
    this.languageChange();
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

  ngOnDestroy() {
    if (this.notificationInterval) clearInterval(this.notificationInterval);
    if (this.fleetStatusInterval) clearInterval(this.fleetStatusInterval);
  }
}
