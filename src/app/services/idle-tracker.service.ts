import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class IdleTrackerService implements OnDestroy {
  private idleTimeout: any;
  private idleInterval: any;
  private idleTime = 2 * 1000; // 20 seconds (adjust as needed)
  
  // BehaviorSubject to track idle state
  private idleSubject = new BehaviorSubject<boolean>(false);
  public idleState$: Observable<boolean> = this.idleSubject.asObservable();

  constructor(private ngZone: NgZone) {
    this.startTracking();
  }

  // Getter for current idle state
  get isIdle(): boolean {
    return this.idleSubject.value;
  }

  // Setter for idle state (private as it should only be modified internally)
  private set isIdle(value: boolean) {
    this.idleSubject.next(value);
  }

  private resetTimer() {
    clearTimeout(this.idleTimeout);

    if (this.isIdle) {
      this.isIdle = false;
      clearInterval(this.idleInterval);
      console.log('User is active');
    }
    
    this.idleTimeout = setTimeout(() => {
      this.isIdle = true;
      console.log('User is idle');
      this.idleInterval = setInterval(() => {
        if (this.isIdle) {
          console.log('User is still idle');
        } else {
          clearInterval(this.idleInterval);
        }
      }, 1000);
    }, this.idleTime);
  }

  private startTracking() {
    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('mousemove', () => this.resetTimer());
      document.addEventListener('mousedown', () => this.resetTimer());
      document.addEventListener('keydown', () => this.resetTimer());
      document.addEventListener('touchstart', () => this.resetTimer());
      this.resetTimer(); 
    });
  }

  ngOnDestroy() {
    clearTimeout(this.idleTimeout);
    clearInterval(this.idleInterval);
    this.idleSubject.complete(); // Clean up the subject
  }
}