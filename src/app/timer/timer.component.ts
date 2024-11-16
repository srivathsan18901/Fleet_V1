import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ProjectService } from '../services/project.service';

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrl: './timer.component.css'
})
export class TimerComponent {
  totalDuration: number = 18000; // 3 hour in seconds
  remainingTime: number = 0; // Initialize with 0
  logoutTimeout: any;

  constructor(private authService: AuthService, private router: Router,
    private projectService: ProjectService) {}

  ngOnInit() {
    this.initializeTimer();
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

  logout() {
    clearInterval(this.logoutTimeout);
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

  private formatTimeUnit(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }
}
