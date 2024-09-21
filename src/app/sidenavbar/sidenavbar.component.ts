import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ProjectService } from '../services/project.service';

@Component({
  selector: 'app-sidenavbar',
  templateUrl: './sidenavbar.component.html',
  styleUrls: ['./sidenavbar.component.css'],
})
export class SidenavbarComponent implements OnInit {
  username: string | null = null;
  userrole: string | null = null;
  showNotificationPopup = false; // Property to track popup visibility
  showProfilePopup = false;
  isSidebarEnlarged = false; // Property to track sidebar enlargement
  constructor(
    private authService: AuthService,
    private router: Router,
    private projectService: ProjectService
  ) {}

  ngOnInit() {
    const user = this.authService.getUser();
    if (user) {
      this.username = user.name;
      this.userrole = user.role;
    }
  }

  toggleNotificationPopup() {
    this.showNotificationPopup = !this.showNotificationPopup;
  }
  toggleProfilePopup() {
    this.showProfilePopup = !this.showProfilePopup;
  }

  toggleSidebar(isEnlarged: boolean) {
    this.isSidebarEnlarged = isEnlarged;
  }
  logout() {
    fetch('http://localhost:3000/auth/logout', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.isCookieDeleted) {
          this.authService.logout();
          this.projectService.clearProjectData();
          this.projectService.clearMapData();
          this.projectService.clearIsMapSet();
          this.router.navigate(['/']);
        }
      })
      .catch((err) => console.log(err));
  }
}
