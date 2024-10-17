import { ChangeDetectorRef, Component } from '@angular/core';
import { ProjectService } from '../../../services/project.service';
import { environment } from '../../../../environments/environment.development';

interface DB {
  name: string;
  code: string;
}
@Component({
  selector: 'app-planner',
  templateUrl: './planner.component.html',
  styleUrl: './planner.component.css',
})
export class PlannerComponent {
  // plannerType: DB[] | undefined;
  selectedProj: any | null = null;
  selectedPlanner: any | null = null;

  plannerType: DB[] = [
    { name: 'ASipp', code: 'ASipp' },
    { name: 'NodeGraph', code: 'NodeGraph' },
  ];

  formData: any = {
    plannerType: '',
    externalInterfaceType: '',
    maxLinearVelocity: '',
    maxRobotsCount: '',
    safeThreshhold: '',
    lookAhead: '',
    maxPointstoRes: '',
    FOV: '',
  };

  constructor(
    private projectService: ProjectService,
    private cdRef: ChangeDetectorRef
  ) {}

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
    const { Planner } = data.project.fleetParams;
    if (!Planner) return;
    // this.selectedPlanner.name = Planner.plannerType; // here..
    this.selectedPlanner = this.plannerType.find(
      (category) => category.name === Planner.plannerType
    );

    this.formData = {
      plannerType: Planner.plannerType,
      externalInterfaceType: Planner.externalInterfaceType,
      maxLinearVelocity: Planner.maxLinearVelocity,
      maxRobotsCount: Planner.maxRobotsCount,
      safeThreshhold: Planner.safeThreshhold,
      lookAhead: Planner.lookAhead,
      maxPointstoRes: Planner.maxPointstoRes,
      FOV: Planner.FOV,
    };
  }

  async savePlanner() {
    if (!this.selectedProj) return;
    if (!this.selectedPlanner) {
      console.log('select planner type');
      return;
    }
    this.formData.plannerType = this.selectedPlanner.name;
    // console.log(this.formData); // handle here..
    try {
      let response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/config-fleet-params/planner`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: this.selectedProj._id,
            plannerParams: this.formData,
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
}
