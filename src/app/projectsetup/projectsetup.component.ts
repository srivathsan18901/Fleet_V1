import { Component,HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ProjectService } from '../services/project.service';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../../environments/environment.development';
import { MessageService } from 'primeng/api';
import Swal from 'sweetalert2';
import { TranslationService } from '../services/translation.service';
interface Flag {
  flagComp: string; // Type based on your data, e.g., string for SVG content
  nameTag: "ENG" | "JAP" | "FRE" | "GER"; // Type based on your data, e.g., string for the flag name
  order: number; // Assuming 'order' is also part of each flag object
}
interface Project {
  _id?: string; // Assuming _id is optional
  projectId?: string; // Add this if projectId is present in your data
  projectName: string; // Other fields based on your data structure
  // Add any other relevant fields
}

@Component({
  selector: 'app-projectsetup',
  templateUrl: './projectsetup.component.html',
  styleUrls: ['./projectsetup.component.css'],
})
export class ProjectsetupComponent {
  isProjDiv1Visible: boolean = false;
  isProjDiv2Visible: boolean = false;
  isProjDiv3Visible: boolean = false;
  sitename: string = '';
  project: Project = { _id: '', projectName: '' };
  projectname: string = '';
  isFocused: { [key: string]: boolean } = {};
  selectedProject: string = '';
  selectedFileName: string = this.getTranslation("IMPORT_PROJECT_FILE");
  errorMessage: string = '';
  productList: Project[] = [];
  selectedFile: File | null = null;
  form: FormData | null = null;
  renamedProj: any;
  isRenamed: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private projectService: ProjectService,
    private cookieService: CookieService,
    private messageService: MessageService,
    private eRef: ElementRef,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    // hook
    // let pDet = this.cookieService.get('project-data');
    // console.log(pDet);
    for(let flag of this.flags){
      if(flag.nameTag === this.translationService.getCurrentLang()){
        this.flagSvg = flag.flagComp;
        this.flagName = flag.nameTag
        break;
      }
    }
    this.selectedFileName = this.getTranslation("IMPORT_PROJECT_FILE");

    fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-project/projects/project-list`,
      { method: 'GET', credentials: 'include' }
    )
      .then((res) => {
        if (res.ok) return res.json();
        else throw new Error("Error : data doesn't attained " + res.status);
      })
      .then((data) => {
        console.log(data.user + ' : ' + data.msg);
        this.productList = data.projects;
      })
      .catch((err) => console.log(err));
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {

    if (!this.eRef.nativeElement.querySelector('.language-selector')?.contains(event.target as Node)) {
      this.languageArrowState = false;
    }
  }
  showProjDiv1() {
    this.isProjDiv1Visible = !this.isProjDiv1Visible;
    this.isProjDiv2Visible = false;
    this.isProjDiv3Visible = false;
    if (!this.isProjDiv1Visible) {
      this.sitename = '';
      this.projectname = '';
      this.isFocused = {};
      this.errorMessage = '';
    }
    // if (!this.isProjDiv2Visible) {
    //   this.selectedFileName = 'Import Project File';
    // }
    if (!this.isProjDiv3Visible) {
      this.selectedProject = '';
    }
  }
  getTranslation(key: string) {
    return this.translationService.getProjectSetupTranslation(key);
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
  showProjDiv2() {
    this.isProjDiv2Visible = !this.isProjDiv2Visible;
    this.isProjDiv1Visible = false;
    this.isProjDiv3Visible = false;
    this.form = null;
    this.selectedFile = null;
    this.selectedProject = '';
    this.selectedFileName = this.getTranslation("IMPORT_PROJECT_FILE");
    if (!this.isProjDiv1Visible) {
      this.sitename = '';
      this.projectname = '';
      this.isFocused = {};
      this.errorMessage = '';
    }
    // if (!this.isProjDiv2Visible) {
    //   this.selectedFileName = 'Import Project File';
    // }
    if (!this.isProjDiv3Visible) {
      this.selectedProject = '';
    }
  }

  showProjDiv3() {
    this.isProjDiv3Visible = !this.isProjDiv3Visible;
    this.isProjDiv2Visible = false;
    this.isProjDiv1Visible = false;
    if (!this.isProjDiv1Visible) {
      this.sitename = '';
      this.projectname = '';
      this.isFocused = {};
      this.errorMessage = '';
    }
    // if (!this.isProjDiv2Visible) {
    //   this.selectedFileName = 'Import Project File';
    // }
    if (!this.isProjDiv3Visible) {
      this.selectedProject = '';
    }
  }

  onIconClick() {
    const fileInput = document.getElementById('fileInput') as HTMLElement;
    fileInput.click();
  }

  async logout() {
    fetch(`http://${environment.API_URL}:${environment.PORT}/auth/logout`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data.isCookieDeleted);
        if (data.isCookieDeleted) {
          this.projectService.clearProjectData();
          this.authService.logout();
          this.router.navigate(['/']);
        }
      })
      .catch((err) => console.log(err));
  }

  async sendZip() {
    try {
      let response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/fleet-project-file/upload-project/`,
        { credentials: 'include', method: 'POST', body: this.form }
      );
      // if (!response.ok)
      //   throw new Error(`err with status code of ${response.status}`);
      let data = await response.json();
      console.log(data);
      if (data.conflicts) {
        this.messageService.add({
          severity: 'error',
          summary: data.msg,
          life: 4000, // Duration the toast will be visible
        });
      }
      if (data.dupKeyErr || data.isZipValidate === false) {
        this.messageService.add({
          severity: 'error',
          summary: data.msg,
          life: 3000, // Duration the toast will be visible
        });
        return;
      } else if (data.error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Try Submitting again',
          life: 3000, // Duration the toast will be visible
        });
        return;
      } else if (data.idExist) {
        this.messageService.add({
          severity: 'error',
          summary: data.msg,
          life: 3000, // Duration the toast will be visible
        });
        this.projectService.clearProjectData();
      } else if (!data.idExist && data.nameExist) {
        return true;
      } else if (!data.err && !data.conflicts && data.user) {
        let project_data = {
          _id: data.project[0]._id,
          projectName: data.project[0].projectName,
          createdAt: data.project[0].createdAt,
          updatedAt: data.project[0].updatedAt,
        };

        let bodyData = {
          name: this.authService.getUser().name,
          role: this.authService.getUser().role,
          projectId: data.project[0]._id,
        };
        const isProjInSession = await this.setProjectInSession(bodyData);

        if (isProjInSession) {
          // alert('Project already in use!');
          Swal.fire({
            position: 'center',
            icon: 'warning',
            html: `<span style="font-size: 20px;">${'Project already in use!'}</span>`,
            showConfirmButton: true,
          });
          return;
        }

        this.projectService.setProjectCreated(true); //
        this.projectService.setSelectedProject(project_data); //
        this.router.navigate(['/dashboard']);
      }
      return false;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async importFile() {
    if (!this.selectedFile) {
      this.messageService.add({
        severity: 'error',
        summary: 'No file Selected to Import',
        life: 3000, // Duration the toast will be visible
      });
      return;
    }
    const projRename = {
      isRenamed: this.isRenamed, // false
      alterName: this.renamedProj, // ""
    };
    if (this.form) this.form = null;
    this.form = new FormData();
    this.form.append('projFile', this.selectedFile);
    this.form.append('projRename', JSON.stringify(projRename));
    const isConflict = await this.sendZip();
    if (isConflict) {
      this.renamedProj = prompt(
        'project with this name already exists, would you like to rename?'
      );
      if (this.renamedProj === null && this.renamedProj === '') return;
      this.isRenamed = true;
    }
  }

  // project file handling..
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (
      file.type !== 'application/zip' &&
      file.type !== 'application/x-zip-compressed'
    ) {
      this.messageService.add({
        severity: 'error',
        summary: 'Selection Error',
        detail: 'File type not valid',
        life: 3000, // Duration the toast will be visible
      });
      return;
    }
    if (file) {
      console.log('File selected:', file.name);
      this.selectedFileName = file.name; // Update the variable with the file name
      // restrict only 15 char..!
      if (this.selectedFileName.length > 15)
        this.selectedFileName = this.selectedFileName.substring(0, 15) + '..';
    }
    this.renamedProj = '';
    let projRename = {
      isRenamed: this.isRenamed, // false
      alterName: this.renamedProj, // ""
    };
    // this.projectService.setProjectCreated(true); //
    // this.projectService.setSelectedProject(file.name); //
    this.selectedFile = file;
  }

  onFocus(inputId: string) {
    this.isFocused[inputId] = true;
  }

  onBlur(inputId: string) {
    this.isFocused[inputId] = false;
  }

  onProjectChange(event: any) {
    try {
      this.project = event;

      // Check for required properties
      if (!this.project) {
        throw new Error('No project selected');
      }

      if (!this.project._id && this.project?.projectId) {
        this.project._id = this.project.projectId;
      }
    } catch (error) {
      // Show error toast notification
      this.messageService.add({
        severity: 'error',
        summary: 'Selection Error',
        detail: 'An error occurred while selecting the project',
        life: 3000, // Duration the toast will be visible
      });
    }

    console.log('Selected Project:', this.project);
  }

  createProject() {
    if (!this.projectname && !this.sitename) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: '*Please fill in both the fields.',
        life: 3000,
      });
      return;
    }

    if (!this.projectname) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: '*Please fill Project Name.',
        life: 3000,
      });
      return;
    }

    if (!this.sitename) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: '*Please fill Site Name.',
        life: 3000,
      });
      return;
    }

    fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-project/project`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          project: { projectName: this.projectname, siteName: this.sitename },
        }),
      }
    )
      .then((res) => {
        if (res.status === 400) {
          this.messageService.add({
            severity: 'error',
            summary: 'Project Error',
            detail: 'Project Name already exists.',
            life: 3000,
          });
          return; // Early return to prevent proceeding with parsing the response
        } else if (res.status === 500) {
          this.messageService.add({
            severity: 'error',
            summary: 'Server Error',
            detail: 'Error in server side.',
            life: 3000,
          });
          return;
        } else if (res.status === 403) {
          this.messageService.add({
            severity: 'error',
            summary: 'Authentication Error',
            detail: 'Token Invalid.',
            life: 3000,
          });
          return;
        }
        return res.json();
      })
      .then(async (data) => {
        if (data && !data.exists) {
          let bodyData = {
            name: this.authService.getUser().name,
            role: this.authService.getUser().role,
            projectId: data.project._id,
          };
          await this.setProjectInSession(bodyData);
          this.projectService.setProjectCreated(true);
          this.projectService.setSelectedProject(data.project);
          this.router.navigate(['/dashboard']);

          this.messageService.add({
            severity: 'success',
            summary: 'Project Created',
            detail: `Project "${data.project.projectName}" created successfully.`,
            life: 3000,
          });
        }
        console.log(data);
      })
      .catch((err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Fetch Error',
          detail: 'An error occurred while creating the project.',
          life: 3000,
        });
      });
  }

  openProject() {
    if (!this.project || !this.project._id || !this.project.projectName) {
      this.messageService.add({
        severity: 'error',
        summary: 'No Project Selected',
        detail: 'Please select a project before proceeding.',
        life: 3000,
      });
      return;
    }

    fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-project/${this.project._id}`,
      { method: 'GET', credentials: 'include' }
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error('Project not found: ' + res.status);
        }
        return res.json();
      })
      .then(async (data) => {
        if (!data.exists) {
          this.messageService.add({
            severity: 'error',
            summary: 'Project Not Found',
            detail:
              'Project does not exist in the database, try deleting it from the user.',
            life: 3000,
          });
          return;
        }

        let project_data = {
          _id: data.project._id,
          projectName: data.project.projectName,
          createdAt: data.project.createdAt,
          updatedAt: data.project.updatedAt,
        };
        let bodyData = {
          name: this.authService.getUser().name,
          role: this.authService.getUser().role,
          projectId: data.project._id,
        };

        let isProjInSession = await this.setProjectInSession(bodyData);

        if (isProjInSession) {
          // alert('Project already in use!');
          Swal.fire({
            position: 'center',
            icon: 'warning',
            html: `<span style="font-size: 20px;">${'Project already in use!'}</span>`,
            showConfirmButton: true,
          });
          return;
        }

        this.projectService.setSelectedProject(project_data);
        this.projectService.setProjectCreated(true);
        this.router.navigate(['/dashboard']);

        this.messageService.add({
          severity: 'success',
          summary: 'Project Opened',
          detail: `Successfully opened project: ${data.project.projectName}`,
          life: 3000,
        });
      })
      .catch((err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Fetch Error',
          detail: 'An error occurred while fetching the project.',
          life: 3000,
        });
      });
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
