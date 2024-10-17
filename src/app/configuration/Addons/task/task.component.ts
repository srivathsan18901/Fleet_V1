import { Component } from '@angular/core';
import { ProjectService } from '../../../services/project.service';
import { environment } from '../../../../environments/environment.development';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrl: './task.component.css',
})
export class TaskComponent {
  selectedProj: any | null = null;
  categories: any[] = [
    { name: 'FIFO', key: 'A' },
    { name: 'LP', key: 'B' },
  ];

  selectedCategory: any = null; // Ensure no selection initially

  constructor(private projectService: ProjectService) {}

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
    const { Task } = data.project.fleetParams;
    if (!Task) return;
    this.selectedCategory = this.categories.find(
      (category) => category.name === Task
    );
  }

  async saveTaskParams() {
    if (!this.selectedCategory) {
      console.log('select type');
      return;
    }
    // console.log(this.selectedCategory.name); // handle data here..
    try {
      let response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/config-fleet-params/task`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: this.selectedProj._id,
            taskParams: { taskManagerType: this.selectedCategory.name },
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
    this.selectedCategory = category;
  }
}
