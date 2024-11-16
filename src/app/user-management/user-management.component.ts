import { Component, ViewEncapsulation, OnInit, ViewChild } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { AuthService } from '../auth.service';
// import { PageEvent } from '@angular/material/paginator';
import { MessageService } from 'primeng/api';
import { ProjectService } from '../services/project.service';
import { log } from 'node:console';
import { stat } from 'node:fs';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css',
})
export class UserManagementComponent implements OnInit {

  filteredTaskData: any;
  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private projectService: ProjectService
  ) {}

  @ViewChild(MatPaginator) paginator!: MatPaginator ;
  selectedProject: any | null = null;
  userId = 0;
  userName = '';
  passWord = '';
  confrimPassword = '';
  errorMessage = '';
  userRole = 'User';
  userRoleOCstate = false;
  userPermissionOCstate = false;
  passwordState = false;
  confrimPasswordState = false;
  passwordType = 'password';
  confrimPasswordType = 'password';
  userCreatePopUp = false;
  deleteUserOCstate = false;
  userCredentialsTemplate: any = {};
  filteredData:any[] = [];
  paginatedData:any[] = [];
  user: any;
  currUserName: string | null = null;
  deleteUserName = '';
  passwordView = 'SHOW';
  confrimPasswordView = 'SHOW';
  deleteUserRole = '';
  pageSize:any = 0
  pageNumber:any = 0

  ngOnInit(): void {
    this.selectedProject = this.projectService.getSelectedProject();
    if (!this.selectedProject && !this.selectedProject._id) {
      console.log('no project selected!');
      return;
    }
    let user = this.authService.getUser();
    if (!user) {
      console.log('Current user state not found');
      return;
    }
    this.currUserName = user.name;
    this.fetchUsers();
    this.setPaginatedData();
  }

  userPermissionState = [
    [
      false,
      false,
      false,
      false,
      false, //index = 0 DASHBOARD =[isAvail, Create, Edit Delete, View]
    ],
    [
      false,
      false,
      false,
      false,
      false, //index = 1 STATISTICS =[isAvail, Create, Edit Delete, View]
    ],
    [
      false,
      false,
      false,
      false,
      false, //index = 2 ROBOTS =[isAvail, Create, Edit Delete, View]
    ],
    [
      false,
      false,
      false,
      false,
      false, //index = 3 CONFIGURATION =[isAvail, Create, Edit Delete, View]
    ],
    [
      false,
      false,
      false,
      false,
      false, //index = 4 ERROR LOGS =[isAvail, Create, Edit Delete, View]
    ],
    [
      false,
      false,
      false,
      false,
      false, //index = 5 TASKS =[isAvail, Create, Edit Delete, View]
    ],
  ];

  userPermissionOptions = [
    {
      order: 0,
      nameTag: 'DASHBOARD',
      isAvail: 0,
      create: 1,
      edit: 2,
      delete: 3,
      view: 4,
    },
    {
      order: 1,
      nameTag: 'STATISTICS',
      isAvail: 0,
      create: 1,
      edit: 2,
      delete: 3,
      view: 4,
    },
    {
      order: 2,
      nameTag: 'ROBOTS',
      isAvail: 0,
      create: 1,
      edit: 2,
      delete: 3,
      view: 4,
    },
    {
      order: 3,
      nameTag: 'CONFIGURATION',
      isAvail: 0,
      create: 1,
      edit: 2,
      delete: 3,
      view: 4,
    },
    {
      order: 4,
      nameTag: 'ERROR LOGS',
      isAvail: 0,
      create: 1,
      edit: 2,
      delete: 3,
      view: 4,
    },
    {
      order: 5,
      nameTag: 'TASKS',
      isAvail: 0,
      create: 1,
      edit: 2,
      delete: 3,
      view: 4,
    },
  ];

  userRoleCredentials = [
    {
      order: 0,
      userRole: 'User',
      nameTag: 'USER',
    },
    {
      order: 1,
      userRole: 'Administrator',
      nameTag: 'ADMIN',
    },
    {
      order: 2,
      userRole: 'Maintainer',
      nameTag: 'MAINTAINER',
    },
  ];

  userCredentials: any[] = []; // Initialized as an empty array

  userPermissionStateFn(order: number, option: number) {
    this.userPermissionState[order][option];
  }

  resetPassword() {
    this.passwordState = false;
    this.confrimPasswordState = false;
    this.passwordType = 'password';
    this.confrimPasswordType = 'password';
    this.passwordView = 'SHOW';
    this.confrimPasswordView = 'SHOW';
  }

  //fetch the user details from the database
  fetchUsers(): void {
    fetch(`http://${environment.API_URL}:${environment.PORT}/auth/fetch-users`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.users) {
          return;
        }
        let { users } = data;

        this.userCredentials = users.map((user: any) => {
          const dateString = new Date(user.createdAt);
          // let createdOn = dateString.getDate() + "/" + dateString.getMonth() + "/" + dateString.getFullYear()
          let createdDate = dateString.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
        
          // Format the time in "11:34 PM" format (12-hour format with AM/PM)
          let createdTime = dateString.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true, // Use 12-hour format with AM/PM
          });
          let formattedDate = `${createdDate}, ${createdTime}`;

          return {
            userId: user._id,
            userName: user.name,
            userRole: user.role,
            // userPermissions: user.permissions, // user permission..
            createdBy: user.createdBy,
            createdOn: formattedDate,
          };
        });
        // console.log(this.userCredentials);  //prints the user credentials
        this.filteredData = this.userCredentials;
        this.setPaginatedData();
      })

      .catch((error) => {
        console.error('Error fetching users:', error);
      });
  }

  validatePassword(password: string): string {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter.';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter.';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number.';
    }
    if (!/[@$!%*?&]/.test(password)) {
      return 'Password must contain at least one special character.';
    }
    return '';
  }

  setPaginatedData(){
    const pageSize1 = this.paginator?.pageSize || 5;  // Default pageSize to 5 if paginator is not yet available
    let pageIndex1 = this.paginator?.pageIndex || 0; // Default pageIndex to 0 (first page)
  
    // Ensure that we reset to the first page if the page becomes empty after deletion
    const totalItems = this.filteredData.length;
    const totalPages = Math.ceil(totalItems / pageSize1);
  
    // If the current page index exceeds the total number of pages after deletion, reset to page 1
    if (pageIndex1 >= totalPages) {
      pageIndex1 = 0;
      this.paginator.pageIndex = pageIndex1;
    }
  
    // Paginate the data based on the current page and page size
    const startIndex = pageIndex1 * pageSize1;
    const endIndex = startIndex + pageSize1;
  
    // Update the paginated data with the sliced portion of the data array
    this.paginatedData = this.filteredData.slice(startIndex, endIndex);
    // console.log(this.filteredRobotData);
  
    // Ensure the paginator reflects the correct page size and total data length
    if (this.paginator) {
      this.paginator.length = this.filteredData.length;
      // console.log(this.filteredRobotData);
    }
     this.fetchUsers();
  }
   


    // Ensure pagination is triggered on page change
    onPageChange(event: PageEvent) {
      this.pageNumber = event.pageIndex
      this.paginator.pageSize = event.pageSize;
      this.pageSize = event.pageSize
      this.setPaginatedData();  // Update paginated data on page change
    }



  trackByTaskId(index: number, user: any): number {
    return user.userId; // or any unique identifier like taskId
  }
  // create user..
  createUser() {
    console.log(this.passwordState, this.confrimPasswordState);
    this.resetPassword();
    if (this.userName === '') {
      this.errorMessage = '*Username is not entered';
      setTimeout(() => {
        this.errorMessage = '';
      }, 4000);
      return;
    } else if (this.passWord === '') {
      this.errorMessage = '*Password is not entered';
      setTimeout(() => {
        this.errorMessage = '';
      }, 4000);
      return;
    } else if (this.confrimPassword === '') {
      this.errorMessage = '*Confirm password is not entered';
      setTimeout(() => {
        this.errorMessage = '';
      }, 4000);
      return;
    } else if (this.passWord !== this.confrimPassword) {
      this.errorMessage = '*Password mismatch';
      setTimeout(() => {
        this.errorMessage = '';
      }, 4000);
      return;
    }

    const passwordValidationMessage = this.validatePassword(this.passWord);
    if (passwordValidationMessage) {
      this.errorMessage = passwordValidationMessage;
      setTimeout(() => {
        this.errorMessage = '';
      }, 5000);
      return;
    }

    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);

    this.userId += 1; // Increment userId

    // Prepare the new user object
    const newUser = {
      // userId: this.userId - 1, //this.userId - 1
      projectName: this.selectedProject.projectName,
      projectId: this.selectedProject._id,
      name: this.userName, // this.userName
      role: this.userRole, //this.userRole
      password: this.passWord, //this.passWord
      createdBy: this.currUserName, // Replace with actual user if applicable
    };

    this.userCredentials.forEach((user) => {
      let username = user.userName;
      let userRole = user.userRole;
      if (
        username.toLowerCase() === this.userName.toLowerCase() &&
        userRole.toLowerCase() === this.userRole.toLowerCase()
      ) {
        alert('User with this credential already exists');
        return;
      }
    });

    // Send POST request to backend
    fetch(`http://${environment.API_URL}:${environment.PORT}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: newUser }),
    })
      .then((response) => {
        // yet to uncomment..
        // if (!response.ok) {
        //   return response.json().then((error) => {
        //     throw new Error(error.error || 'Failed to create user');
        //   });
        // }
        return response.json();
      })
      .then((data) => {
        if (data.isExist) {
          alert('Person with this credentials already exist');
          return;
        }
        this.messageService.add({
          severity: 'success',
          summary: `${this.userName}`,
          detail: 'User Created Successfully',
          life: 4000,
        });
        console.log('User created successfully:', data);

        // Fetch updated user list after successful creation
        this.fetchUsers();

        // Reset form fields
        this.userName = '';
        this.passWord = '';
        this.confrimPassword = '';
        this.userRole = 'User';
        // Close create user popup
        this.userCreatePopUpOpen();
      })
      .catch((error) => {
        console.error('Error creating user:', error);
        this.errorMessage = error.message;
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      });
  }

  //Deleting the user credentials from the database
  deleteUser(username: any, userRole: any) {
    let findingAdmin = this.userCredentials.filter(
      (user) => user.userRole === 'Administrator'
    );
    console.log('Delete User =>>>', findingAdmin);

    if (findingAdmin.length <= 1 && userRole === 'Administrator') {
      // alert('Should have atleast one admin');
      this.deleteUserPopUp();
      this.messageService.add({
        severity: 'error',
        summary: 'Failed ',
        detail: 'Should have atleast one admin',
        life: 5000,
      });
      return;
    }
    console.log('DELETE:', username); // Log the username to delete
    const userToDelete = this.userCredentials.find(
      (user) => username === user.userName
    );

    if (!userToDelete) {
      console.error('User not found for deletion:', username);
      this.messageService.add({
        severity: 'error',
        summary: 'Failed ',
        detail: 'Should have atleast one admin',
        life: 5000,
      });
      this.setPaginatedData();
      this.fetchUsers();
      return;
    }

    // api to delete user
    fetch(
      `http://${environment.API_URL}:${environment.PORT}/auth/delete-user`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userToDelete),
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to delete user (${response.status} ${response.statusText})`
          );
        }
        // Successfully deleted user
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `User ${username} has been deleted successfully`,
          life: 5000,
        });
        this.setPaginatedData();
        this.fetchUsers();
        // Remove the user from the local list
        this.userCredentials = this.userCredentials.filter(
          (user) => user.userName !== username
        );
      })
      .catch((error) => {
        console.error('Error deleting user:', error);
      });

    this.deleteUserName = '';
    this.deleteUserPopUp();
    this.setPaginatedData();
  }

  getDeleteUser(userName: any, userRole: any) {
    this.deleteUserName = userName;
    this.deleteUserRole = userRole;
    this.setPaginatedData();
    console.log(this.deleteUserName);
    this.deleteUserPopUp();
  }

  changeUserRole(order: number) {
    this.userRole = this.userRoleCredentials[order].userRole;
  }

  userRoleChange() {
    this.userRoleOCstate = !this.userRoleOCstate;
  }

  showPassword() {
    this.passwordState = !this.passwordState;
    this.passwordType = this.passwordState ? 'text' : 'password';
    this.passwordView = this.passwordState ? 'HIDE' : 'SHOW';
    // console.log('PASS State: ', this.passwordState);
  }

  showConfrimPassword() {
    this.confrimPasswordState = !this.confrimPasswordState;
    this.confrimPasswordType = this.confrimPasswordState ? 'text' : 'password';
    this.confrimPasswordView = this.confrimPasswordState ? 'HIDE' : 'SHOW';
    // console.log('CPASS State: ', this.confrimPasswordState);
  }

  userCreatePopUpOpen(isCancel: boolean = false) {
    this.userRoleOCstate = false;
    this.userCreatePopUp = !this.userCreatePopUp;
    this.errorMessage = '';
    this.userName = '';
    this.passWord = '';
    this.confrimPassword = '';
    this.userRole = 'User';
    this.resetPassword();

    if (isCancel) {
      // Display a toast indicating that the user creation was canceled
      this.messageService.add({
        severity: 'error',
        summary: 'User Creation Failed',
        detail: 'User creation process was canceled.',
        life: 4000,
      });
    }
    console.log(this.passwordState, this.confrimPasswordState);
  }

  // fetch user-permissions pop-up..
  userPermissionPopUpOpen(userId: string) {
    this.user = this.userCredentials.find((user) => userId === user.userId);
    if (this.user) {
      console.log('User found:', this.user.userName);
      // Fetch user permissions and update the state
      this.fetchUserPermissions(this.user.userId);
      this.userPermissionOCstate = !this.userPermissionOCstate;
    } else {
      console.error('User not found:', userId);
    }
  }

  // fetch user permission..
  fetchUserPermissions(userId: string) {
    fetch(
      `http://${environment.API_URL}:${environment.PORT}/auth/get-permissions/${userId}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch user permissions');
        }
        return response.json();
      })
      .then((data) => {
        // console.log(data.permissions);
        // Update the local permission state
        this.userPermissionState = [
          [
            data.permissions.dashboard.enable,
            data.permissions.dashboard.create,
            data.permissions.dashboard.edit,
            data.permissions.dashboard.delete,
            data.permissions.dashboard.view,
          ],
          [
            data.permissions.statistics.enable,
            data.permissions.statistics.create,
            data.permissions.statistics.edit,
            data.permissions.statistics.delete,
            data.permissions.statistics.view,
          ],
          [
            data.permissions.robots.enable,
            data.permissions.robots.create,
            data.permissions.robots.edit,
            data.permissions.robots.delete,
            data.permissions.robots.view,
          ],
          [
            data.permissions.configuration.enable,
            data.permissions.configuration.create,
            data.permissions.configuration.edit,
            data.permissions.configuration.delete,
            data.permissions.configuration.view,
          ],
          [
            data.permissions.errLogs.enable,
            data.permissions.errLogs.create,
            data.permissions.errLogs.edit,
            data.permissions.errLogs.delete,
            data.permissions.errLogs.view,
          ],
          [
            data.permissions.tasks.enable,
            data.permissions.tasks.create,
            data.permissions.tasks.edit,
            data.permissions.tasks.delete,
            data.permissions.tasks.view,
          ],
        ];
      })
      .catch((error) => {
        console.error('Error fetching user permissions:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Failed',
          detail: 'Error fetching user permissions',
          life: 5000,
        });
      });
  }

  userPermissionPopUpClose() {
    this.userPermissionOCstate = !this.userPermissionOCstate;
  }

  changeUserPermission(option: number, i: number) {
    if (i === 0 && this.userPermissionState[option][i]) {
      for (let i = 0; i <= 4; i++) this.userPermissionState[option][i] = false;
      return;
    }

    let firstState = this.userPermissionState[option]
      .slice(1)
      .filter((state) => state); // filter => only returns condition met..!

    if (firstState.length === 1) this.userPermissionState[option][0] = false;
    if (
      !this.userPermissionState[option][0] &&
      !this.userPermissionState[option][i]
    )
      this.userPermissionState[option][0] = true;

    // needed one..!
    this.userPermissionState[option][i] = !this.userPermissionState[option][i];
  }

  // save edited permissions..
  saveEditPermission() {
    if (!this.user) {
      console.error('No user selected for updating permissions');
      this.messageService.add({
        severity: 'error',
        summary: 'Failed',
        detail: 'No user selected for updating permissions',
        life: 5000,
      });
      return;
    }

    // Prepare the permissions object to send to the backend
    const updatedPermissions = {
      dashboard: {
        enable: this.userPermissionState[0][0],
        create: this.userPermissionState[0][1],
        edit: this.userPermissionState[0][2],
        delete: this.userPermissionState[0][3],
        view: this.userPermissionState[0][4],
      },
      statistics: {
        enable: this.userPermissionState[1][0],
        create: this.userPermissionState[1][1],
        edit: this.userPermissionState[1][2],
        delete: this.userPermissionState[1][3],
        view: this.userPermissionState[1][4],
      },
      robots: {
        enable: this.userPermissionState[2][0],
        create: this.userPermissionState[2][1],
        edit: this.userPermissionState[2][2],
        delete: this.userPermissionState[2][3],
        view: this.userPermissionState[2][4],
      },
      configuration: {
        enable: this.userPermissionState[3][0],
        create: this.userPermissionState[3][1],
        edit: this.userPermissionState[3][2],
        delete: this.userPermissionState[3][3],
        view: this.userPermissionState[3][4],
      },
      errLogs: {
        enable: this.userPermissionState[4][0],
        create: this.userPermissionState[4][1],
        edit: this.userPermissionState[4][2],
        delete: this.userPermissionState[4][3],
        view: this.userPermissionState[4][4],
      },
      tasks: {
        enable: this.userPermissionState[5][0],
        create: this.userPermissionState[5][1],
        edit: this.userPermissionState[5][2],
        delete: this.userPermissionState[5][3],
        view: this.userPermissionState[5][4],
      },
    };

    // Send the PUT request to update the user permissions
    fetch(
      `http://${environment.API_URL}:${environment.PORT}/auth/edit-permissions`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: this.user.userId,
          permissions: updatedPermissions,
        }),
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to update user');
        }
        return response.json();
      })
      .then((data) => {
        console.log('User updated successfully:', data);
        // Success toast
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `User ${this.user.userName}'s permissions have been updated successfully`,
          life: 5000,
        });
        // Optionally refresh the user list or update the local user list
        this.fetchUsers();
      })
      .catch((error) => {
        console.error('Error updating user:', error);
        // Error toast
        this.messageService.add({
          severity: 'error',
          summary: 'Failed',
          detail: 'Error updating user permissions',
          life: 5000,
        });
      });

    // Close the popup
    this.userPermissionPopUpClose();
  }

  deleteUserPopUp() {
    this.deleteUserOCstate = !this.deleteUserOCstate;
  }
}
