import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { ProjectService } from './services/project.service';
import { environment } from '../environments/environment.development';
import { UserPermissionService } from './services/user-permission.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user: { name: string; role: string } | null = null;

  constructor(
    private cookieService: CookieService,
    private router: Router,
    private projectService: ProjectService,
    private userPermissionService: UserPermissionService
  ) {}

  private isCookieEmpty(): boolean {
    let user = this.cookieService.get('_user');
    return user ? false : true;
  }

  // Simulating user login
  login(user: { name: string; role: string }) {
    // if (this.isCookieEmpty()) {
    this.cookieService.set('_user', JSON.stringify(user));
    this.user = user;
    // }
  }

  logout() {
    localStorage.removeItem('timerStartTime');
    localStorage.removeItem('lastSession');
    localStorage.removeItem('maxAge');
    fetch(`http://${environment.API_URL}:${environment.PORT}/auth/logout`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.isCookieDeleted) {
          this.projectService.clearProjectData();
          this.projectService.clearMapData();
          this.projectService.clearIsMapSet();
          this.projectService.clearAllUserState();
          this.userPermissionService.deletePermissions();
          console.log('Logging out...');
          this.router.navigate(['/']);
        }
      })
      .catch((err) => console.log(err));
  }

  // Checking if the user is logged in
  isLoggedIn(): boolean {
    const cookieValue = this.cookieService.get('_user');
    return cookieValue !== undefined && cookieValue !== '';
  }

  // Getting the user data
  getUser(): any {
    // { name: string; role: string } | null
    if (!this.isCookieEmpty()) {
      // !this.user &&
      const cookieValue = this.cookieService.get('_user');
      this.user = cookieValue ? JSON.parse(cookieValue) : null;
    }
    return this.user;
  }

  // Getting permissions Data
  getPermissions() {
    // return this.permissionsSource.getValue(); // Get current permissions
    // return this.permissions;
  }
}
