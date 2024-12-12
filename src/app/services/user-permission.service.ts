import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserPermissionService {
  private permissionsSource = new BehaviorSubject<any>(null); // Holds the permissions data
  permissions$ = this.permissionsSource.asObservable(); // Observable for components to subscribe

  constructor() {}

  setPermissions(permissions: any) {
    this.permissionsSource.next(permissions); // Update permissions
  }

  getPermissions() {
    return this.permissionsSource.getValue(); // Get current permissions
  }
}
