import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { ProjectService } from './services/project.service';
import { environment } from '../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user: { name: string; role: string } | null = null;

  constructor(private cookieService: CookieService, private router: Router,private projectService: ProjectService) {}

  private isCookieEmpty(): boolean {
    return document.cookie === '';
  }

  // Simulating user login
  login(user: { name: string; role: string }) {
    if (this.isCookieEmpty()) {
      this.cookieService.set('_user', JSON.stringify(user));
      this.user = user;
    }
  }

  // Simulating user logout
  // logout() {
  //   if (!this.isCookieEmpty()) {
  //     this.cookieService.delete('_user', '/');
  //     // document.cookie = '_user=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
  //     this.user = null;
  //   }
  // }
  logout() {
    localStorage.removeItem('timerStartTime');
    localStorage.removeItem('lastSession');
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
  getUser(): { name: string; role: string } | null {
    if (!this.user && !this.isCookieEmpty()) {
      const cookieValue = this.cookieService.get('_user');
      if (cookieValue) {
        this.user = JSON.parse(cookieValue);
      }
    }
    return this.user;
  }

}
