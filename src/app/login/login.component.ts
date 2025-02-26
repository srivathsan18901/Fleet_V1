import { Component, HostListener,ElementRef  } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { CookieService } from 'ngx-cookie-service';
import { ProjectService } from '../services/project.service';
import { environment } from '../../environments/environment.development';
import { env } from 'node:process';
import { MessageService } from 'primeng/api';
import { UserPermissionService } from '../services/user-permission.service';
import { SessionService } from '../services/session.service';
import Swal from 'sweetalert2';
import { TranslationService } from '../services/translation.service';
interface Flag {
  flagComp: string; // Type based on your data, e.g., string for SVG content
  nameTag: "ENG" | "JAP" | "FRE" | "GER"; // Type based on your data, e.g., string for the flag name
  order: number; // Assuming 'order' is also part of each flag object
}
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
    private sessionService: SessionService,
    private eRef: ElementRef,
    private translationService: TranslationService
  ) {}
  errorTimeout: any;
  setErrorMessage(message: string, duration: number = 2000) {
    this.errorMessage = message;

    // Clear any existing timeout to prevent multiple timers
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }

    // Remove error message after the specified duration
    this.errorTimeout = setTimeout(() => {
      this.errorMessage = null;
    }, duration);
  }
  ngOnInit() {
    for(let flag of this.flags){
      if(flag.nameTag === this.translationService.getCurrentLang()){
        this.flagSvg = flag.flagComp;
        this.flagName = flag.nameTag
        break;
      }
    }
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
  
  flags: Flag[] = [
    { flagComp: '<img src="../../assets/Language/Eng.svg">', nameTag: 'ENG', order: 0 },
    { flagComp: '<img src="../../assets/Language/Jap.svg">', nameTag: 'JAP', order: 1 },  
    { flagComp: '<img src="../../assets/Language/Fre.svg">', nameTag: 'FRE', order: 2 },  
    { flagComp: '<img src="../../assets/Language/Ger.svg">', nameTag: 'GER', order: 3 }, 
  ];
  

  trackFlag(index: number, flag: any): number {
    return flag.order; // Use the unique identifier for tracking
  }
  languageArrowState = false;
  languageChange() {
    this.languageArrowState = !this.languageArrowState;
  }

  flagSvg = this.flags[0].flagComp;
  flagName = this.flags[0].nameTag;

  changeFlag(order: number) {
    const selectedLanguage = this.flags[order].nameTag;
    this.flagSvg = this.flags[order].flagComp;
    this.flagName = this.flags[order].nameTag;
    this.translationService.setLanguage(selectedLanguage);
  }
  getTranslation(key: string) {
    return this.translationService.getLoginTranslation(key);
  }
  getProjectTranslation(key: string) {
    return this.translationService.getProjectSetupTranslation(key);
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
      this.setErrorMessage(this.getTranslation('EnterUsernamePasswordRole'));
      this.messageService.add({
        severity: 'error',
        summary: this.getTranslation('AuthFailed'),
        detail: this.getTranslation('EnterUsernamePasswordRole'),
        life: 4000,
      });
      return;
    }
    if (!username && !password) {
      this.setErrorMessage(this.getTranslation('EnterUsernamePassword'));
      this.messageService.add({
        severity: 'error',
        summary: this.getTranslation('AuthFailed'),
        detail: this.getTranslation('EnterUsernamePassword'),
        life: 4000,
      });
      return;
    }
    if (!password && !userRole) {
      this.setErrorMessage(this.getTranslation('EnterUsernamePassword'));
      this.messageService.add({
        severity: 'error',
        summary: this.getTranslation('AuthFailed'),
        detail: this.getTranslation('EnterUsernamePassword'),
        life: 4000,
      });
      return;
    }
    if (!userRole && !username) {
      this.setErrorMessage(this.getTranslation('EnterUsernameRole'));
      this.messageService.add({
        severity: 'error',
        summary: this.getTranslation('AuthFailed'),
        detail: this.getTranslation('EnterUsernameRole'),
        life: 4000,
      });
      return;
    }
    if (!userRole) {
      this.setErrorMessage(this.getTranslation('SelectUserRole'));
      this.messageService.add({
        severity: 'error',
        summary: this.getTranslation('AuthFailed'),
        detail: this.getTranslation('SelectUserRole'),
        life: 4000,
      });
      return;
    }
    if (!username) {
      this.setErrorMessage(this.getTranslation('EnterUsername'));
      this.messageService.add({
        severity: 'error',
        summary: this.getTranslation('AuthFailed'),
        detail: this.getTranslation('EnterUsername'),
        life: 4000,
      });
      return;
    }
    if (!password) {
      this.setErrorMessage(this.getTranslation('EnterPassword'));
      this.messageService.add({
        severity: 'error',
        summary: this.getTranslation('AuthFailed'),
        detail: this.getTranslation('EnterPassword'),
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
        // console.log(res, '---response');
        if (res.status === 404 || res.status === 401) {
          this.setErrorMessage(this.getTranslation('WrongPasswordOrRole'));
          this.messageService.add({
            severity: 'error',
            summary: this.getTranslation('AuthFailed'),
            detail: this.getTranslation('WrongPasswordOrRole'),
            life: 4000,
          });
        }
        if (res.status === 409) {
          this.messageService.add({
            severity: 'warn',
            summary: this.getTranslation('AuthFailed'),
            detail: this.getTranslation('UserAlreadySignedIn'),
            life: 4000,
          });
        }
        return res.json();
        // throw new Error('Login failed');
      })
      .then(async (data) => {
        // console.log(data.user.projects);
        if (data.isUserInSession) {
          // alert(data.msg);
          Swal.fire({
            position: 'center',
            icon: 'warning',
            html: `<span style="font-size: 20px;">${data.msg}</span>`,
            showConfirmButton: true,
          });
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

            if (!data.user.projects || !data.user.projects.length) {
              this.messageService.add({
                severity: 'warn',
                detail: this.getTranslation('ProjectNotAssigned'),
                life: 4000,
              });
              this.authService.logout();
              return;
            }
            this.authService.login({
              name: data.user.name,
              role: data.user.role,
            });
            let project_data = {
              _id: data.user.projects[0].projectId,
              projectName: data.user.projects[0].projectName,
              createdAt: JSON.stringify(new Date()), // data.projects[0].createdAt
              updatedAt: JSON.stringify(new Date()), // data.projects[0].createdAt
            };

            let bodyData = {
              name: this.authService.getUser().name,
              role: this.authService.getUser().role,
              projectId: data.user.projects[0].projectId,
            };

            let isProjInSession = await this.setProjectInSession(bodyData);

            if (isProjInSession) {
              Swal.fire({
                position: 'center',
                icon: 'warning',
                html: `<span style="font-size: 20px;">${this.getProjectTranslation("PROJECT_IN_USE")}</span>`,
                showConfirmButton: true,
              });
              this.authService.logout(); // yet to look at it..
              return;
            }

            this.projectService.setSelectedProject(project_data);
            this.projectService.setProjectCreated(true);
            this.messageService.add({
              severity: 'success',
              summary: `${this.getTranslation("Welcome")} ${data.user.projects[0].projectName}`,
              detail: this.getTranslation('AuthenticationSuccess'),
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
            summary: this.getTranslation('Welcome'),
            detail: this.getTranslation('AuthenticationSuccess'),
            life: 4000,
          });
          this.router.navigate(['project_setup']);
        }
      })
      .catch((err) => {
        console.error(err);
        this.setErrorMessage(this.getTranslation('LoginFailed'));
        this.messageService.add({
          severity: 'error',
          summary: this.getTranslation('AuthFailed'),
          detail: this.getTranslation('LoginFailed'),
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
    if (!this.eRef.nativeElement.querySelector('.language-selector')?.contains(event.target as Node)) {
      this.languageArrowState = false;
    }
  }

  async setProjectInSession(bodyData: any): Promise<any> {
    try {
      let response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/auth/set-project-session`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData),
        }
      );

      let data = await response.json();
      if (data.error) {
        console.log('Error while set project in session : ', data.error);
        return false;
      }

      console.log(data);

      return data.isProjInSession;
    } catch (error) {
      console.log('Error in set project session : ', error);
      return null;
    }
  }
}
