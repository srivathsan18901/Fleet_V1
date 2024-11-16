import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ProjectService } from '../services/project.service';
import { environment } from '../../environments/environment.development';
import { MessageService } from 'primeng/api';

interface Robo {
  roboDet: any;
  pos: { x: number; y: number; orientation: number };
}

@Component({
  selector: 'app-robot-popup',
  templateUrl: './robot-popup.component.html',
  styleUrls: ['./robot-popup.component.css'],
})
export class RobotPopupComponent {
  @Input() robos!: Robo[];
  @Input() mapName: string = '';
  @Input() isVisible: boolean = false;
  @Input() robots: any[] = []; // Robots data will be passed from parent
  @Output() close = new EventEmitter<void>();
  @Output() addRobot = new EventEmitter<any[]>(); // Emit an array of selected robots

  constructor(
    private messageService: MessageService,
    private projectService: ProjectService
  ) {}
  //..
  mapData: any | null = null;
  showError: boolean = false; // To track if an error message should be shown

  listedRobo: any[] = [];
  availableRobots: any[] = [];

  ngOnChanges() {
    this.listedRobo = [];
    let avlRobo = this.robos.map((robo) => robo.roboDet);
    this.availableRobots.forEach((robo) => {
      // Check if the robot is NOT present in avlRobo
      const isPresent = avlRobo.some((avrobo) => avrobo.id === robo.id);

      // If the robot is not found in avlRobo, push it into listedRobo
      if (!isPresent) {
        this.listedRobo.push(robo);
      }
    });
  }

  async ngOnInit() {
    let roboCounter: number = 0;

    this.listedRobo = [];
    if (!this.mapName) return;
    let res1 = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${this.mapName}`,
      { method: 'GET', credentials: 'include' }
    );
    let mapData = await res1.json();

    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/robo-configuration/get-robos/${mapData.map._id}`,
      { method: 'GET', credentials: 'include' }
    );
    let data = await response.json();
    // console.log(data,"data from the json")

    // this.listedRobo = data.populatedRobos;
    let avlRobo = this.robos.map((robo) => robo.roboDet);
    if (this.robos.length)
      roboCounter = this.robos[this.robos.length - 1].roboDet.id;

    let finalizeRobo: any[] = [];
    // let id = 0;
    this.availableRobots = data.populatedRobos.map((robo: any) => {
      // id++;
      // roboCounter += 1;
      return {
        id: robo.amrId,
        roboName: robo.roboName,
        ipAdd: robo.ipAdd,
        selected: false,
        uuid:robo.uuid,
        amrid:robo.amrId
      };
    });

    this.availableRobots.forEach((robo) => {
      // Check if the robot is NOT present in avlRobo
      const isPresent = avlRobo.some((avrobo) => avrobo.id === robo.id);

      // If the robot is not found in avlRobo, push it into listedRobo
      if (!isPresent) {
        finalizeRobo.push(robo);
      }
    });

    this.listedRobo = finalizeRobo;
  }

  closePopup() {
    // this.resetSelections(); // Reset the selections when the popup is closed
    this.close.emit();
  }

  addSelectedRobots() {
    // Filter the selected robots from listedRobo (since this is what's used in the template)
    const selectedRobots = this.listedRobo.filter((robot) => robot.selected);
    // console.log(selectedRobots);
    // return

    if (selectedRobots.length > 0) {
      // Emit the selected robots
      this.addRobot.emit(selectedRobots);
      // Mark the robots as placed
      selectedRobots.forEach((robot) => {
        robot.placed = true; // Mark the robot as placed
        robot.selected = false; // Deselect the robot after placing
      });

      this.showError = false;

      // Show success toast message
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Robots added successfully!',
      });

      this.close.emit(); // Close the popup after success
    } else {
      this.showError = true;
      // Show error toast message
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No robots selected!',
      });
    }

    // Reset the selections
    this.resetSelections();
  }

  private resetSelections() {
    this.listedRobo.forEach((robot) => {
      robot.selected = false; // Reset selection for listedRobo (since it's displayed in the template)
    });
  }
}
