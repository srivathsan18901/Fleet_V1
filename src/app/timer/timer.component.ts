import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ProjectService } from '../services/project.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.css']
})
export class TimerComponent {
  private subscription: Subscription = new Subscription();
  totalDuration: number = 18000; // 3 hours in seconds
  remainingTime: number = 0; // Initialize with 0
  fiveMinuteRemaining: number = 300; // 5 minutes in seconds
  logoutTimeout: any;
  fiveMinuteTimeout: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private projectService: ProjectService
  ) {}

  ngOnInit() {
    this.initializeTimer();
    // this.initializeFiveMinuteTimer();   
    this.subscription = this.projectService.isFleetUp$.subscribe(status => {
      // this.fleetStatus = status;
      console.log('Fleet status changed:', status);
      // this.performActionOnStateChange(status); // Optional: Trigger a method on change
    }); 
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe(); // Clean up the subscription
  }
  initializeTimer() {
    const storedStartTime = localStorage.getItem('timerStartTime');
    const lastSession = localStorage.getItem('lastSession');

    if (storedStartTime && lastSession === 'active') {
      const elapsedTime = Math.floor((Date.now() - parseInt(storedStartTime)) / 1000);
      this.remainingTime = this.totalDuration - elapsedTime;

      if (this.remainingTime <= 0) {
        this.logout();
      }
    } else {
      this.resetTimer();
    }
    this.startLogoutTimer();
  }

  startLogoutTimer() {
    this.logoutTimeout = setInterval(() => {
      if (this.remainingTime > 0) {
        this.remainingTime--;
      } else {
        this.logout();
      }
    }, 1000);
  }

  resetTimer() {
    this.remainingTime = this.totalDuration;
    localStorage.setItem('timerStartTime', Date.now().toString());
    localStorage.setItem('lastSession', 'active');
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

  triggerFiveMinuteAction() {

  }

  logout() {
    clearInterval(this.logoutTimeout);
    clearInterval(this.fiveMinuteTimeout);
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
    return `${this.formatTimeUnit(hours)}:${this.formatTimeUnit(minutes)}:${this.formatTimeUnit(seconds)}`;
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
