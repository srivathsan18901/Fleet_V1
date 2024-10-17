import { ChangeDetectorRef, Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { ProjectService } from '../../../services/project.service';
import { environment } from '../../../../environments/environment.development';
import { FormBuilder } from '@angular/forms';

interface DB {
  name: string;
  code: string;
}

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrl: './general.component.css',
})
export class GeneralComponent {
  // dtype: DB[] | undefined;
  // iptype: DB[] | undefined;

  selectedProject: any | null = null;

  formData: any ;

  selectedDb: any = { name: '', code: '' };
  selectedIp: any = { name: '', code: '' };
  selectedRoboManagerType: any = { name: '', code: '' };
  selectedTaskManagerType: any = { name: '', code: '' };

  dtype: any[] = [
    { name: 'PostgreSQL', code: 'NY' },
    { name: 'MongoDB', code: 'RM' },
    { name: 'SQL', code: 'LDN' },
  ];

  iptype: any[] = [
    { name: 'Static', code: 'NY' },
    { name: 'Dynamic', code: 'RMD' },
    { name: 'Public', code: 'LDN' },
    { name: 'Private', code: 'LDM' },
  ];

  robotManagerType: any[] = [
    { name: 'RMtype_1', code: 'MY' },
    { name: 'RMtype_2', code: 'RO' },
    { name: 'RMtype_3', code: 'LDC' },
  ];

  taskManagerType: any[] = [
    { name: 'TaskMtype_1', code: 'UY' },
    { name: 'TaskMtype_2', code: 'RI' },
    { name: 'TaskMtype_3', code: 'LQN' },
  ];

  constructor(
    private projectService: ProjectService,
    private cdRef: ChangeDetectorRef,
    private fb: FormBuilder,
  ) {
    this.formData = {
      selectedDb: '',
      selectedIp: '',
      selectedRoboManagerType: '',
      selectedTaskManagerType: '',
      fleetServerMode: '',
      serverIP: '',
      serverPort: '',
      databaseIp: '',
      databaseName: '',
    }
  }

  reset(){
    this.formData = {
      selectedDb: '',
      selectedIp: '',
      selectedRoboManagerType: '',
      selectedTaskManagerType: '',
      fleetServerMode: '',
      serverIP: '',
      serverPort: '',
      databaseIp: '',
      databaseName: '',
    }
  }

  async ngOnInit() {
    this.selectedProject = this.projectService.getSelectedProject();
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-project/${this.selectedProject._id}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );
    if (!response.ok) {
      console.log('Err with status code of ', response.status);
    }
    let data = await response.json();
    const { General } = data.project.fleetParams;
    if (!General) return;
    // this.selectedDb.name = General.selectedDb; // here...
    this.selectedDb = this.dtype.find(
      (category) => category.name === General.selectedDb
    );
    this.selectedIp = this.iptype.find(
      (category) => category.name === General.selectedIp
    );
    this.selectedRoboManagerType = this.robotManagerType.find(
      (category) => category.name === General.selectedRoboManagerType
    );
    this.selectedTaskManagerType = this.taskManagerType.find(
      (category) => category.name === General.selectedTaskManagerType
    );
    this.formData = {
      selectedDb: General.selectedDb,
      selectedIp: General.selectedIp,
      selectedRoboManagerType: General.selectedRoboManagerType,
      selectedTaskManagerType: General.selectedTaskManagerType,
      fleetServerMode: General.fleetServerMode,
      serverIP: General.serverIP,
      serverPort: General.serverPort,
      databaseIp: General.databaseIp,
      databaseName: General.databaseName,
    };
  }

  async saveParams() {
    if (!this.selectedProject) {
      console.log('no map selected');
      return;
    }

    // Ensure only the relevant values are passed to formData
    this.formData.selectedDb = this.selectedDb?.name || '';
    this.formData.selectedIp = this.selectedIp?.name || '';
    this.formData.selectedRoboManagerType = this.selectedRoboManagerType?.name || '';
    this.formData.selectedTaskManagerType = this.selectedTaskManagerType?.name || '';

    console.log(this.formData); // Now formData should be safe for handling

    try {
      let response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/config-fleet-params/general`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: this.selectedProject._id,
            generalParams: this.formData,  // Send the plain object without circular references
          }),
        }
      );

      if (!response.ok)
        throw new Error(`Error while saving db, status: ${response.status}`);

      let data = await response.json();

      if (data.isSet) {
        alert('Fleet configured!');
        // Manually reset the formData object
        // this.reset();
        return;
      }
      alert('Fleet not configured!');
    } catch (error) {
      console.log('Error occurred:', error);
    }
  }


}




// import { ChangeDetectorRef, Component, OnInit, ViewChild  } from '@angular/core';
// import { InputTextModule } from 'primeng/inputtext';
// import { ProjectService } from '../../../services/project.service';
// import { environment } from '../../../../environments/environment.development';
// import { FormBuilder } from '@angular/forms';
// import { NgForm } from '@angular/forms';
// import { FormDataService } from '../../config.service';

// interface DB {
//   name: string;
//   code: string;
// }

// @Component({
//   selector: 'app-general',
//   templateUrl: './general.component.html',
//   styleUrl: './general.component.css',
// })
// export class GeneralComponent {
//   // dtype: DB[] | undefined;
//   // iptype: DB[] | undefined;

//   selectedProject: any | null = null;

//   formData: any ;
//     // Define generalForm as a NgForm type and create a reference to it
//     @ViewChild('generalForm') generalForm!: NgForm;
//   selectedDb: any = { name: '', code: '' };
//   selectedIp: any = { name: '', code: '' };
//   selectedRoboManagerType: any = { name: '', code: '' };
//   selectedTaskManagerType: any = { name: '', code: '' };

//   dtype: any[] = [
//     { name: 'PostgreSQL', code: 'NY' },
//     { name: 'MongoDB', code: 'RM' },
//     { name: 'SQL', code: 'LDN' },
//   ];

//   iptype: any[] = [
//     { name: 'Static', code: 'NY' },
//     { name: 'Dynamic', code: 'RMD' },
//     { name: 'Public', code: 'LDN' },
//     { name: 'Private', code: 'LDM' },
//   ];

//   robotManagerType: any[] = [
//     { name: 'RMtype_1', code: 'MY' },
//     { name: 'RMtype_2', code: 'RO' },
//     { name: 'RMtype_3', code: 'LDC' },
//   ];

//   taskManagerType: any[] = [
//     { name: 'TaskMtype_1', code: 'UY' },
//     { name: 'TaskMtype_2', code: 'RI' },
//     { name: 'TaskMtype_3', code: 'LQN' },
//   ];

//   constructor(
//     private projectService: ProjectService,
//     private cdRef: ChangeDetectorRef,
//     private fb: FormBuilder,
//     private formDataService: FormDataService,
//   ) {
//     // Initialize formData from the service if it exists
//     this.formData = this.formDataService.getFormData() || {
//       selectedDb: null,
//       selectedIp: null,
//       selectedRoboManagerType: null,
//       selectedTaskManagerType: null,
//       serverIP: '',
//       serverPort: '',
//       databaseIp: '',
//       databaseName: '',
//     };
//   }




//   async ngOnInit() {
//     this.selectedProject = this.projectService.getSelectedProject();
//     let response = await fetch(
//       `http://${environment.API_URL}:${environment.PORT}/fleet-project/${this.selectedProject._id}`,
//       {
//         method: 'GET',
//         credentials: 'include',
//       }
//     );
//     if (!response.ok) {
//       console.log('Err with status code of ', response.status);
//     }
//     let data = await response.json();
//     const { General } = data.project.fleetParams;
//     if (General) {
//       this.selectedDb = this.dtype.find((category) => category.name === General.selectedDb);
//       this.selectedIp = this.iptype.find((category) => category.name === General.selectedIp);
//       this.selectedRoboManagerType = this.robotManagerType.find((category) => category.name === General.selectedRoboManagerType);
//       this.selectedTaskManagerType = this.taskManagerType.find((category) => category.name === General.selectedTaskManagerType);
//     }
//   }

//   async saveParams() {
//     if (!this.selectedProject) {
//       console.log('no map selected');
//       return;
//     }

//     // Ensure only the relevant values are passed to formData
//     this.formData.selectedDb = this.selectedDb?.name || '';
//     this.formData.selectedIp = this.selectedIp?.name || '';
//     this.formData.selectedRoboManagerType = this.selectedRoboManagerType?.name || '';
//     this.formData.selectedTaskManagerType = this.selectedTaskManagerType?.name || '';
//     // this.resetFormState();
//     console.log(this.formData); // Now formData should be safe for handling

//     try {
//       let response = await fetch(
//         `http://${environment.API_URL}:${environment.PORT}/config-fleet-params/general`,
//         {
//           method: 'POST',
//           credentials: 'include',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             projectId: this.selectedProject._id,
//             generalParams: this.formData,  // Send the plain object without circular references
//           }),
//         }
//       );

//       if (!response.ok)
//         throw new Error(`Error while saving db, status: ${response.status}`);

//       let data = await response.json();

//       if (data.isSet) {
//         alert('Fleet configured!');
//         // this.resetFormState();
//         return;
//       }
//       alert('Fleet not configured!');
//     } catch (error) {
//       console.log('Error occurred:', error);
//     }
//   }


// }
