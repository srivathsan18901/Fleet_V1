import {
  Component,
  OnInit,
  ElementRef,
  HostListener,
  Renderer2,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ProjectService } from '../services/project.service';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../../environments/environment.development';
import { UserPermissionService } from '../services/user-permission.service';
import { IsFleetService } from '../services/shared/is-fleet.service';
import { Subscription } from 'rxjs';
import { SessionService } from '../services/session.service';
import Swal from 'sweetalert2';
import { TranslationService } from '../services/translation.service';
import { UserManagementComponent } from '../user-management/user-management.component';
interface Flag {
  flagComp: string; // Type based on your data, e.g., string for SVG content
  nameTag: 'ENG' | 'JAP' | 'FRE' | 'GER'; // Type based on your data, e.g., string for the flag name
  order: number; // Assuming 'order' is also part of each flag object
}
@Component({
  selector: 'app-sidenavbar',
  templateUrl: './sidenavbar.component.html',
  styleUrls: ['./sidenavbar.component.css'],
})
export class SidenavbarComponent implements OnInit {
  private subscription: Subscription = new Subscription();
  projectName: string | null = null;
  username: string | null = null;
  userrole: string  = "";
  robotActivities: any[] = [];
  fleetActivities: any[] = [];
  selectedMap: any | null = null;
  showNotificationPopup = false; // Property to track popup visibility
  showProfilePopup = false;
  isSidebarEnlarged = false; // Property to track sidebar enlargement
  cookieValue: any = '';
  isNotificationVisible = false;
  languageArrowState = false;
  isFleetUp: boolean = false; // Set to true or false based on your logic
  // isAmqpUp: boolean = false;
  private autoCloseTimeout: any;
  notifications: any[] = [];
  private subscriptions: Subscription[] = [];
  processedErrors: Set<string>; // To track processed errors
  filteredRobotActivities = this.robotActivities;
  filteredNotifications = this.notifications;
  userManagementData: any;
  private langSubscription!: Subscription;
  fleetStatusInterval: ReturnType<typeof setInterval> | null = null;
  notificationInterval: ReturnType<typeof setInterval> | null = null;
  sessionCheck: ReturnType<typeof setInterval> | null = null;

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
    this.userManagementData = this.userPermissionService.getPermissions();
    this.processedErrors = new Set<string>(); // yet to noify later..
  }
  getProjectTranslation(key: string) {
    return this.translationService.getProjectSetupTranslation(key);
  }
  async ngOnInit() {
    for (let flag of this.flags) {
      if (flag.nameTag === this.translationService.getCurrentLang()) {
        this.flagSvg = flag.flagComp;
        this.flagName = flag.nameTag;
        break;
      }
    }

    this.renderer.listen('document', 'click', (event: Event) => {
      const target = event.target as HTMLElement;
      const notificationElement = this.eRef.nativeElement.querySelector(
        '.notification-popup'
      );
      const profileElement = this.eRef.nativeElement.querySelector('.Profile-popup');
      const languageDropdownElement = this.eRef.nativeElement.querySelector('.language-dropdown');
      const languageToggleElement = this.eRef.nativeElement.querySelector('.language-toggle');
      if (
        this.showProfilePopup &&
        profileElement &&
        !profileElement.contains(target) &&
        !target.classList.contains('PPicon') // Profile icon
      ) {
        this.showProfilePopup = false;
      }
      if (
        this.showNotificationPopup &&
        notificationElement &&
        !notificationElement.contains(target) &&
        !target.classList.contains('Nlogo') // Notification icon
      ) {
        this.showNotificationPopup = false;
      }

      // Close Language Dropdown
      if (
        this.languageArrowState && // Check if the dropdown is open
        languageDropdownElement &&
        !languageDropdownElement.contains(target) &&
        languageToggleElement !== target && // Ensure the toggle is excluded
        !languageToggleElement.contains(target)
      ) {
        this.languageArrowState = false; // Close the language dropdown
      }
    });
    this.selectedProject = this.projectService.getSelectedProject();
    this.projectName = this.selectedProject.projectName;
    this.subscription = this.projectService.isFleetUp$.subscribe(
      async (status) => {
        console.log('Fleet status changed:', status);
        await this.recordFleetStatus(status); // change the method by storing it in cookie, later for sure!!!
      }
    );
    const fleetSub = this.isFleetService.isFleet$.subscribe((status) => {
      this.isFleet = status;
      this.updateUI(); // Update UI based on the current state
    });
    this.subscriptions.push(fleetSub);
    const savedIsFleet = sessionStorage.getItem('isFleet');
    if (savedIsFleet !== null) {
      this.isFleet = savedIsFleet === 'true'; // Convert string to boolean
      this.isFleetService.setIsFleet(this.isFleet); // Sync the state with the service
    }
    // this.userManagementData= this.userPermissionService.getPermissions();
    const user = this.authService.getUser();
    if (user) {
      this.username = user.name;
      this.userrole = this.getTranslation(user.role);
    }
    // console.log(this.getTranslation(user.role));
    this.langSubscription = this.translationService.currentLanguage$.subscribe(
      (val) => {
        const user = this.authService.getUser();
        if (user) {
          this.username = user.name;
          this.userrole = this.getTranslation(user.role);
        }
        this.cdRef.detectChanges();
      }
    );

    this.cookieValue = JSON.parse(this.cookieService.get('_user'));
    this.selectedMap = this.projectService.getMapData();

    this.startGetFleetStatus();

    this.sessionCheck = setInterval(() => {
      let sessionId = this.cookieService.get('_token');
      let timeRemaining = this.sessionService.getRemainingTime();
      if (!sessionId || (timeRemaining && timeRemaining <= 0)) {
        Swal.fire({
          position: 'center',
          icon: 'warning',
          html: `<span style="font-size: 20px;">${this.getProjectTranslation(
            'session_almost_over'
          )}</span>`,
          showConfirmButton: true,
        });
        this.logout();
        return;
      }
    }, 1000 * 5);

    if (!this.selectedMap) return;
    await this.getRoboStatus();
    await this.getTaskErrs();
    this.notificationInterval = setInterval(async () => {
      // only allowed to check if fleet is up
      if (this.isFleet == true) {
        await this.getRoboStatus();
        await this.getTaskErrs(); // or run in indivdual..
      }
    }, 1000 * 5); // max to 30 or 60 sec
  }

  get iconUrl(): string {
    return this.isFleet ? this.fleetIconUrl : this.simulationIconUrl;
  }

  fleetIconUrl: string = '../assets/fleet_icon.png';
  simulationIconUrl: string = '../assets/simulation_icon.png';

  get buttonLabel(): string {
    // console.log("button lable")
    return this.isFleet ? 'Fleet Mode' : 'Simulation';
  }

  updateUI() {
    // Example of adding a simple fade-in/out effect to a specific element
    const modeElement = document.querySelector('.mode-indicator');
    if (modeElement) {
      modeElement.classList.add('fade-out');
      setTimeout(() => {
        modeElement.classList.remove('fade-out');
        modeElement.classList.add('fade-in');
      }, 300); // Adjust timing for the effect
    }
    // Example of updating a dynamic title based on mode
    const titleElement = document.querySelector('.mode-title');
    if (titleElement) {
      titleElement.textContent = this.isFleet
        ? 'Fleet Mode Active'
        : 'Simulation Mode Active';
    }
  }

  async recordFleetStatus(status: boolean): Promise<void> {
    let projectId = this.projectService.getSelectedProject();
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-project/track-fleet-status`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectId._id,
          isFleetOn: status,
          timeStamp: Date.now(),
        }),
      }
    );
    // if (!response.ok) {
    //   console.log('Err with status code of ', response.status);
    // }
    let data = await response.json();
    if (data.error) return;
    const { fleetRecords } = data;
    // console.log(fleetRecords);
  }

  async startGetFleetStatus() {
    try {
      // this.isFleetService.abortFleetStatusSignal(); // yet to uncomment..
      await this.getFleetStatus();
    } catch (error) {
      console.log(error);
    }
    setTimeout(() => this.startGetFleetStatus(), 1000 * 3);
  }

  async getFleetStatus() {
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/stream-data/get-fleet-status`,
      {
        signal: this.isFleetService.getAbortController().signal,
      }
    );
    let data = await response.json();

    this.isFleetUp = data.fleetUp ? true : false;

    let prevFleetStatus = this.projectService.getIsFleetUp();
    if (prevFleetStatus === this.isFleetUp) return; // && this.isAmqpUp
    this.projectService.setIsFleetUp(this.isFleetUp); // && this.isAmqpUp
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
  isImage: boolean = false;
  isFleet: boolean = false;
  get buttonClass(): string {
    return this.isFleet ? 'fleet-background' : 'simulation-background';
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

  // Function to show the notification popup
  showNotification() {
    this.showNotificationPopup = true;
    this.languageArrowState = false;
    this.showProfilePopup = false;
  }

  closeNotification() {
    this.showNotificationPopup = false;
  }

  closePopup() {
    this.languageArrowState = false;
    this.showProfilePopup = false;
    this.showNotificationPopup = false;
  }

  toggleProfilePopup() {
    this.showProfilePopup = !this.showProfilePopup;
    this.showNotificationPopup = false;
    this.languageArrowState = false;
  }
  toggleNotificationPopup(event: Event) {
    event.stopPropagation();
    this.showNotificationPopup = !this.showNotificationPopup;
    this.showProfilePopup = false;
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

  flags: Flag[] = [
    {
      flagComp: '<img src="../../assets/Language/Eng.svg">',
      nameTag: 'ENG',
      order: 0,
    },
    {
      flagComp: '<img src="../../assets/Language/Jap.svg">',
      nameTag: 'JAP',
      order: 1,
    },
    {
      flagComp: '<img src="../../assets/Language/Fre.svg">',
      nameTag: 'FRE',
      order: 2,
    },
    {
      flagComp: '<img src="../../assets/Language/Ger.svg">',
      nameTag: 'GER',
      order: 3,
    },
  ];

  trackFlag(index: number, flag: any): number {
    return flag.order; // Use the unique identifier for tracking
  }

  languageChange() {
    this.languageArrowState = !this.languageArrowState;
    this.isNotificationVisible = false;
    this.showProfilePopup = false;
  }

  flagSvg = this.flags[0].flagComp;
  flagName = this.flags[0].nameTag;

  changeFlag(order: number) {
    const selectedLanguage = this.flags[order].nameTag;
    this.flagSvg = this.flags[order].flagComp;
    this.flagName = this.flags[order].nameTag;
    this.translationService.setLanguage(selectedLanguage);
  }
  getTranslation(key: string) {
    return this.translationService.getsideNavTranslation(key);
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
  selectedProject: any | null = null;
  async exportProject() {
    if (!this.selectedProject) return;
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-project-file/download-project/${this.selectedProject.projectName}`,
      {
        credentials: 'include',
      }
    );
    if (!response.ok) alert('try once again');
    else {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${this.selectedProject.projectName}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  }

  goToDocumentation(): void {
    window.open('/documentation', '_blank');
  }

  // Document for resource
  downloadDocument() {
    const link = document.createElement('a');
    link.href = 'path/to/your/document.pdf';
    link.download = 'Training_Resource_Document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  ngOnDestroy() {
    if (this.notificationInterval) clearInterval(this.notificationInterval);
    if (this.fleetStatusInterval) clearInterval(this.fleetStatusInterval);
    if (this.sessionCheck) clearInterval(this.sessionCheck);
  }
}
