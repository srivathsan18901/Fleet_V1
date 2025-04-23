import {
  Component,
  OnInit,
  ElementRef,
  HostListener,
  Renderer2,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  EventEmitter,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { ProjectService } from '../../services/project.service';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../../../environments/environment.development';
import { UserPermissionService } from '../../services/user-permission.service';
import { IsFleetService } from '../../services/shared/is-fleet.service';
import { Subscription } from 'rxjs';
import { SessionService } from '../../services/session.service';
import Swal from 'sweetalert2';
import { TranslationService } from '../../services/translation.service';
import { UserManagementComponent } from '../../user-management/user-management.component';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent {


    constructor(
      private authService: AuthService,
      private isFleetService: IsFleetService,
      private router: Router,
      private projectService: ProjectService,
      private userPermissionService: UserPermissionService,
      private eRef: ElementRef,
      private cookieService: CookieService,
      private renderer: Renderer2,
      private sessionService: SessionService,
      private cdRef: ChangeDetectorRef,
      private translationService: TranslationService
    ){this.processedErrors = new Set<string>(); // yet to noify later..
      }

    showNotificationPopup: boolean = false;
    showProfilePopup: boolean = false;
    languageArrowState: boolean = false;
    notifications: any[] = [];
    robotActivities: any[] = [];
    filteredNotifications = this.notifications;
    processedErrors: Set<string>; // To track processed errors
    roboStatusController: AbortController | null = null;
    taskErrController: AbortController | null = null;
    filteredRobotActivities = this.robotActivities;
    selectedMap: any | null = null;

    @Output() notificationOpened = new EventEmitter<void>();



  getTranslation(key: string) {
    return this.translationService.getsideNavTranslation(key);
  }

  toggleNotificationPopup(event: Event) {
    event.stopPropagation();
    this.showNotificationPopup = !this.showNotificationPopup;
    this.showProfilePopup = false;
    this.languageArrowState = false;
    this.notificationOpened.emit(); // Notify parent to toggle
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

  clearAllNotifications() {
    this.notifications = [];
    this.processedErrors.clear();
  }

    async getRoboStatus(): Promise<void> {
      if (this.roboStatusController) this.roboStatusController.abort();
      this.roboStatusController = new AbortController();
  
      const response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/stream-data/get-live-robos/${this.selectedMap.id}`,
        {
          method: 'GET',
          credentials: 'include',
          signal: this.roboStatusController.signal,
        }
      );
  
      const data = await response.json();
      // console.log(data);
      if (!data.map || data.error) return;
      this.robotActivities = data.robos;
  
      if (!('robots' in this.robotActivities)) return;
  
      let { robots }: any = this.robotActivities;
      if (!robots?.length) return;
  
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
  
              let notificationKey = `${error.description}`;
              if (this.processedErrors?.has(notificationKey)) continue;
              this.processedErrors?.add(notificationKey);
  
              this.notifications.push({
                label: `${criticality}`,
                message: `${error.description}`,
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
      if (this.taskErrController) this.taskErrController.abort();
      this.taskErrController = new AbortController();
  
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
          signal: this.taskErrController.signal,
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

    closePopup() {
      this.languageArrowState = false;
      this.showProfilePopup = false;
      this.showNotificationPopup = false;
    }


     @HostListener('document:click', ['$event'])
      handleClickOutside(event: Event) {
        // Check if the click is outside the notification popup
        if (!this.eRef.nativeElement.contains(event.target)) {
          this.closePopup();
        }
      }
}


