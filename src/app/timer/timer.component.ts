import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ProjectService } from '../services/project.service';
import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { SessionService } from '../services/session.service';
import { CookieService } from 'ngx-cookie-service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.css'],
})
export class TimerComponent {
  private subscription: Subscription = new Subscription();
  totalDuration: number = this.sessionService.getMaxAge() + 20 || 1200; // 20 minutes in seconds
  remainingTime: number = 0; // Initialize with 0
  fiveMinuteRemaining: number = 300; // 5 minutes in seconds
  logoutTimeout: any;
  fiveMinuteTimeout: any;

  trackSessionAge: any;

  isLogoutTriggered: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private projectService: ProjectService,
    private sessionService: SessionService,
    private cookieService: CookieService
  ) {}

  ngOnInit() {
    this.initializeTimer();
    this.totalDuration = this.sessionService.getMaxAge();
    // this.initializeFiveMinuteTimer();
    // this.subscription = this.projectService.isFleetUp$.subscribe( // uncomment if in case..
    //   async (status) => {
    //     console.log('Fleet status changed:', status);
    //     await this.recordFleetStatus(status); // change the method by storing it in cookie, later for sure!!!
    //   }
    // );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe(); // Clean up the subscription
    clearInterval(this.logoutTimeout); // optional..
    clearInterval(this.fiveMinuteTimeout);
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

  initializeTimer() {
    const storedStartTime = localStorage.getItem('timerStartTime');
    const lastSession = localStorage.getItem('lastSession');

    if (storedStartTime && lastSession === 'active') {
      const elapsedTime = Math.floor(
        (Date.now() - parseInt(storedStartTime)) / 1000
      );
      this.remainingTime = this.totalDuration - elapsedTime;

      // yet to uncomment..
      if (!this.cookieService.get('_token')) this.logout();
    } else {
      this.resetTimer();
    }
    this.startLogoutTimer();
  }

  startLogoutTimer() {
    this.logoutTimeout = setInterval(() => {
      let sessionId = this.cookieService.get('_token');
      if (this.remainingTime > 0) this.remainingTime--;
      this.sessionService.setRemainingTime(this.remainingTime);
      // if (!sessionId || this.remainingTime <= 0) {
      //   this.logout();
      //   return;
      // }
    }, 1000 * 5);
  }

  resetTimer() {
    this.remainingTime = this.totalDuration;
    // localStorage.setItem('timerStartTime', Date.now().toString());
    // localStorage.setItem('lastSession', 'active');
  }

  initializeFiveMinuteTimer() {
    const fiveMinuteStartTime = localStorage.getItem('fiveMinuteStartTime');

    if (fiveMinuteStartTime) {
      const elapsedFiveMinutes = Math.floor(
        (Date.now() - parseInt(fiveMinuteStartTime)) / 1000
      );
      this.fiveMinuteRemaining = 300 - (elapsedFiveMinutes % 300);

      if (this.fiveMinuteRemaining <= 0) {
        this.triggerFiveMinuteAction();
      }
    } else {
      this.resetFiveMinuteTimer();
    }

    this.startFiveMinuteTimer();
  }

  startFiveMinuteTimer() {
    this.fiveMinuteTimeout = setInterval(() => {
      if (this.fiveMinuteRemaining > 0) {
        this.fiveMinuteRemaining--;
      } else {
        this.triggerFiveMinuteAction();
        this.resetFiveMinuteTimer();
      }
    }, 1000);
  }

  resetFiveMinuteTimer() {
    this.fiveMinuteRemaining = 300; // Reset to 5 minutes
    localStorage.setItem('fiveMinuteStartTime', Date.now().toString());
  }

  triggerFiveMinuteAction() {}

  logout() {
    if (this.isLogoutTriggered) return;
    clearInterval(this.logoutTimeout);
    clearInterval(this.fiveMinuteTimeout);
    this.isLogoutTriggered = true; // yet to commnent in case of not workin..
    // alert('sry! your session time gonna over now');
    Swal.fire({
      position: 'center',
      icon: 'warning',
      html: `<span style="font-size: 20px;">Heads up! Your session is almost over.</span>`,
      showConfirmButton: true,
    });
    // clearInterval(this.trackSessionAge);
    this.projectService.clearProjectData();
    this.projectService.clearMapData();
    this.projectService.clearIsMapSet();
    this.authService.logout(); // Use the logout method from AuthService
    this.router.navigate(['/']);
  }

  getFormattedTime(): string {
    const hours = Math.floor(this.remainingTime / 3600);
    const minutes = Math.floor((this.remainingTime % 3600) / 60);
    const seconds = this.remainingTime % 60;
    return `${this.formatTimeUnit(hours)}:${this.formatTimeUnit(
      minutes
    )}:${this.formatTimeUnit(seconds)}`;
  }

  getFormattedFiveMinuteTime(): string {
    const minutes = Math.floor(this.fiveMinuteRemaining / 60);
    const seconds = this.fiveMinuteRemaining % 60;
    return `${this.formatTimeUnit(minutes)}:${this.formatTimeUnit(seconds)}`;
  }

  private formatTimeUnit(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }
}
