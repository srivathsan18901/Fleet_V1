import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserPermissionService {
  permissionKey:string = 'user-permissions'
  private permissionsSource = new BehaviorSubject<any>(null); // Holds the permissions data
  // permissions$ = this.permissionsSource.asObservable(); // Observable for components to subscribe
  // permissions: any|null = null

  constructor(private cookieService: CookieService) {}

  setPermissions(permissions: any) {
    // this.permissionsSource.next(permissions); // Update permissions
    // this.permissions = permissions
    this.cookieService.set(this.permissionKey, JSON.stringify(permissions));
  }

  getPermissions() {
    // return this.permissionsSource.getValue(); // Get current permissions
    // return this.permissions;
    let permissions = this.cookieService.get(this.permissionKey)
    return permissions ? JSON.parse(permissions) : null;
  }

  deletePermissions(){
    this.cookieService.delete(this.permissionKey, '/')
  }
}
