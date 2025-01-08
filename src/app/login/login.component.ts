import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { CookieService } from 'ngx-cookie-service';
import { ProjectService } from '../services/project.service';
import { environment } from '../../environments/environment.development';
import { env } from 'node:process';
import { MessageService } from 'primeng/api';
import { UserPermissionService } from '../services/user-permission.service';
import { SessionService } from '../services/session.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  passwordFieldType = 'password';
  showPassword = false;
  focusedContainer: HTMLElement | null = null;
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private projectService: ProjectService, //private cookieService: CookieService
    private UserService: ProjectService,
    private userPermissionService: UserPermissionService,
    private messageService: MessageService,
    private sessionService: SessionService
  ) {}

  ngOnInit() {
    fetch(`http://${environment.API_URL}:${environment.PORT}/auth/logout`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.isCookieDeleted) {
          // || data.isSessionDestroyed
          this.projectService.clearProjectData();
          this.authService.logout();
          // this.router.navigate(['/']);
        }
      })
      .catch((err) => console.log(err));
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.passwordFieldType = this.showPassword ? 'text' : 'password';
  }

  validateForm() {
    const username = (document.getElementById('username') as HTMLInputElement)
      .value;
    const password = (document.getElementById('password') as HTMLInputElement)
      .value;
    const userRole = (
      document.querySelector(
        'input[name="userRole"]:checked'
      ) as HTMLInputElement
    )?.value;

    if (!username && !password && !userRole) {
      this.errorMessage = '*Enter Username, Password and Select User Role';
      this.messageService.add({
        severity: 'error',
        summary: 'Authencation Failed',
        detail: 'Enter Username, Password and Select User Role',
        life: 4000,
      });
      return;
    }
    if (!username && !password) {
      this.errorMessage = '*Enter Username and Password';
      this.messageService.add({
        severity: 'error',
        summary: 'Authencation Failed',
        detail: 'Enter Username and Password',
        life: 4000,
      });
      return;
    }
    if (!password && !userRole) {
      this.errorMessage = '*Enter Password and Select User Role';
      this.messageService.add({
        severity: 'error',
        summary: 'Authencation Failed',
        detail: 'Enter Password and Select User Role',
        life: 4000,
      });
      return;
    }
    if (!userRole && !username) {
      this.errorMessage = '*Select User Role and Enter Username';
      this.messageService.add({
        severity: 'error',
        summary: 'Authencation Failed',
        detail: 'Select User Role and Enter Username',
        life: 4000,
      });
      return;
    }
    if (!userRole) {
      this.errorMessage = '*Select User Role ';
      this.messageService.add({
        severity: 'error',
        summary: 'Authencation Failed',
        detail: 'Select User Role ',
        life: 4000,
      });
      return;
    }
    if (!username) {
      this.errorMessage = '*Enter Username';
      this.messageService.add({
        severity: 'error',
        summary: 'Authencation Failed',
        detail: 'Enter Username',
        life: 4000,
      });
      return;
    }
    if (!password) {
      this.errorMessage = '*Enter Password ';
      this.messageService.add({
        severity: 'error',
        summary: 'Authencation Failed',
        detail: 'Enter Password',
        life: 4000,
      });
      return;
    }

    this.errorMessage = null; // Clear any previous error messages

    fetch(`http://${environment.API_URL}:${environment.PORT}/auth/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        user: {
          name: username,
          role: userRole,
          password: password,
        },
      }),
    })
      .then((res) => {
        // console.log(res,'---response')
        if (res.status === 404 || res.status === 401) {
          this.errorMessage =
            "*Wrong password or user with this role doesn't exist";
          this.messageService.add({
            severity: 'error',
            summary: 'Authencation Failed',
            detail: "Wrong password or user with this role doesn't exist",
            life: 4000,
          });
        }
        if (res.status === 409) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Authencation Failed',
            detail: 'User already signed in somewhere..',
            life: 4000,
          });
        }
        return res.json();
        // throw new Error('Login failed');
      })
      .then((data) => {
        // console.log(data.user.projects);
        if (data.isUserInSession) {
          alert(data.msg);
          return;
        }
        this.sessionService.setMaxAge(data.maxAge);
        localStorage.setItem('timerStartTime', Date.now().toString()); // yet to handle it with services..
        localStorage.setItem('lastSession', 'active');
        if (data.user) {
          let { permissions } = data.user;
          this.userPermissionService.setPermissions(permissions);
          if (data.user.role === 'User') {
            // console.log('user initilalized')

            if (!data.project) {
              alert('No project has been assigned to this user.');
              return;
            }
            this.authService.login({
              name: data.user.name,
              role: data.user.role,
            });
            let project_data = {
              _id: data.project._id,
              projectName: data.project.projectName,
              createdAt: data.project.createdAt,
              updatedAt: data.project.updatedAt,
            };
            this.projectService.setSelectedProject(project_data);
            this.projectService.setProjectCreated(true);
            this.messageService.add({
              severity: 'success',
              summary: `Welcome ${this.projectService.setSelectedProject(
                data.project
              )}`,
              detail: 'Authentication Success',
              life: 4000,
            });
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 100);
            return;
          }
          this.authService.login({
            name: data.user.name,
            role: data.user.role,
          });
          this.messageService.add({
            severity: 'success',
            summary: `Welcome`,
            detail: 'Authentication Success',
            life: 4000,
          });
          this.router.navigate(['project_setup']);
        }
      })
      .catch((err) => {
        console.error(err);
        this.errorMessage = 'Login failed. Please try again.';
        this.messageService.add({
          severity: 'error',
          summary: 'Authencation Failed',
          detail: 'Login failed. Please try again',
          life: 4000,
        });
      });
  }

  onContainerClick(event: Event) {
    const target = event.currentTarget as HTMLElement;
    if (this.focusedContainer && this.focusedContainer !== target) {
      this.focusedContainer.classList.remove('focused');
    }
    target.classList.add('focused');
    const input = target.querySelector('input');
    if (input) {
      input.focus();
    }
    this.focusedContainer = target;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.focusedContainer && !this.focusedContainer.contains(target)) {
      this.focusedContainer.classList.remove('focused');
      this.focusedContainer = null;
    }
  }
}
