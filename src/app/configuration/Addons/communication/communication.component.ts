import { Component } from '@angular/core';
import { ProjectService } from '../../../services/project.service';
import { environment } from '../../../../environments/environment.development';

@Component({
  selector: 'app-communication',
  templateUrl: './communication.component.html',
  styleUrl: './communication.component.css',
})
export class CommunicationComponent {
  categories: any[] = [
    { name: 'FastDDS', key: 'A' },
    { name: 'MarkFastDDSNATeting', key: 'M' },
    { name: 'Simulation', key: 'P' },
    { name: 'SimulationSocket', key: 'R' },
    { name: 'Socket', key: 'S' },
    { name: 'MQTT', key: 'Q' },
  ];

  selectedProj: any | null = null;
  selectedCategory: any = null; // No initial selection

  formData: any = {
    externalInterfaceIp: '',
    externalInterfaceType: '',
    roboInterfaceIp: '',
    roboInterfaceType: '',
    selectedCategory: '',
  };

  constructor(private projectService: ProjectService ) {

  }

  async ngOnInit() {
    this.selectedProj = this.projectService.getSelectedProject();
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-project/${this.selectedProj._id}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );
    if (!response.ok) {
      console.log('Err with status code of ', response.status);
    }
    let data = await response.json();
    const { Communication } = data.project.fleetParams;
    if (!Communication) return;
    this.selectedCategory = this.categories.find(
      (category) => category.name === Communication.selectedCategory
    );
    this.formData = {
      externalInterfaceIp: Communication.externalInterfaceIp,
      externalInterfaceType: Communication.externalInterfaceType,
      roboInterfaceIp: Communication.roboInterfaceIp,
      roboInterfaceType: Communication.roboInterfaceType,
      selectedCategory: Communication.selectedCategory,
    };
  }

  async saveCommParams() {
    if (!this.selectedCategory) {
      console.log('select type');
      return;
    }
    this.formData.selectedCategory = this.selectedCategory.name;
    // console.log(this.formData); // handle data here..
    try {
      let response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/config-fleet-params/communication`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: this.selectedProj._id,
            communicationParams: this.formData,
          }),
        }
      );

      if (!response.ok)
        throw new Error(`err while saving db, ${response.status}`);

      let data = await response.json();
      // console.log(data);
      if (data.isSet) {
        alert('Fleet configured!');
        return;
      }
      alert('Fleet not configured!');
    } catch (error) {
      console.log('Err occured :', error);
    }
  }

  selectCategory(category: any) {
    this.selectedCategory = category; // Method to select a category programmatically
  }
}
