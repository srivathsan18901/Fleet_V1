import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class IsFleetService {
  private isFleetSubject = new BehaviorSubject<boolean>(false);
  isFleet$ = this.isFleetSubject.asObservable();

  setIsFleet(value: boolean) {
    this.isFleetSubject.next(value);
  }

  
}
