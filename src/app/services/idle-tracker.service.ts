import { Injectable, NgZone } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class IdleTrackerService {
  private idleTimeout: any;
  private idleTime = 10000; // 60 seconds (adjust as needed)
  public isIdle = false;

  constructor(private ngZone: NgZone) {
    this.startTracking();
  }

  private resetTimer() {
    clearTimeout(this.idleTimeout);
    this.isIdle = false;
    this.idleTimeout = setTimeout(() => {
      this.isIdle = true;
      console.log('User is idle');
    }, this.idleTime);
  }

  private startTracking() {
    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('mousemove', () => this.resetTimer());
      document.addEventListener('mousedown', () => this.resetTimer());
      document.addEventListener('keydown', () => this.resetTimer());
      document.addEventListener('touchstart', () => this.resetTimer());

      this.resetTimer(); // Initialize the timer
    });
  }
}
