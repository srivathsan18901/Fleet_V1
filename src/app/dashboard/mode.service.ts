import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModeService {

  constructor() { }
  private modeSource = new BehaviorSubject<string>('Sim mode'); // Initial value
  currentMode$ = this.modeSource.asObservable();

  updateMode(mode: string) {
    this.modeSource.next(mode); // Notify subscribers of the mode change
  }
}
