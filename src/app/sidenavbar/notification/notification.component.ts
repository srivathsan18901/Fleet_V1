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
  styleUrl: './notification.component.css',
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
  ) {
    this.processedErrors = new Set<string>(); // yet to noify later..
  }

  showNotificationPopup: boolean = false;
  showProfilePopup: boolean = false;
  languageArrowState: boolean = false;
  notifications: any[] = [];
  robotActivities: any[] = [];
  filteredNotifications = this.notifications;
  processedErrors: Set<string>; // To track processed errors
  mapData: any | null = null;
  filteredRobotActivities = this.robotActivities;
  selectedMap: any | null = null;

  errorEventSource!: EventSource;

  @Output() notificationOpened = new EventEmitter<void>();

  ngOnInit() {
    this.mapData = this.projectService.getMapData();
    if (!this.mapData) return;

    this.getErrsLogs();
  }

  getTranslation(key: string) {
    return this.translationService.getsideNavTranslation(key);
  }

  toggleNotificationPopup(event: Event) {
    event.stopPropagation();
    this.showNotificationPopup = !this.showNotificationPopup;
    this.notificationOpened.emit(); // Notify parent to toggle
  }

  getNotificationClass(criticality: string): string {
    switch (criticality) {
      case 'high':
        return 'alert-red';
      case 'medium':
        return 'alert-yellow';
      case 'low':
        return 'alert-green';
      default:
        return '';
    }
  }

  clearAllNotifications(event: Event): void {
    event.stopPropagation(); // ✅ Prevents popup from closing
    this.notifications = [];
    this.processedErrors.clear();
  }

  async getErrsLogs(): Promise<void> {
    const URL = `http://${environment.API_URL}:${environment.PORT}/stream-data/live-notification-errors/${this.mapData.id}`;

    if (this.errorEventSource) this.errorEventSource.close();
    this.errorEventSource = new EventSource(URL);

    this.errorEventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
    };

    this.errorEventSource.onerror = (error) => {
      this.errorEventSource.close();
      console.log('Error while fetching notification errors: ', error);
    };

    // this.notifications = .map((error: any) => {
    //   return {
    //     id: error.id,
    //     timestamp: ``, // ${formattedDate},  e.g., "06:43 PM, 22-Apr"
    //     code: error.code,
    //     criticality: error.criticality.toLowerCase(),
    //     description: error.description,
    //     duration: error.duration,
    //   };
    // });
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

  getDotClass(criticality: string): string {
    switch (criticality) {
      case 'high':
        return 'dot red';
      case 'medium':
        return 'dot yellow';
      case 'low':
        return 'dot green';
      default:
        return 'dot';
    }
  }

  removeNotification(index: number): void {
    this.notifications.splice(index, 1);
  }

  ngOnDestroy() {
    if (this.errorEventSource) this.errorEventSource.close();
  }
}
