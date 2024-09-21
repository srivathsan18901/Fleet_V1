import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ProjectService } from '../services/project.service';
import { environment } from '../../environments/environment.development';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-robot-popup',
  templateUrl: './robot-popup.component.html',
  styleUrls: ['./robot-popup.component.css'],
})
export class RobotPopupComponent {
  @Input() mapName:string = '';
  @Input() isVisible: boolean = false;
  @Input() robots: any[] = []; // Robots data will be passed from parent
  @Output() close = new EventEmitter<void>();
  @Output() addRobot = new EventEmitter<any[]>(); // Emit an array of selected robots

  constructor(private messageService: MessageService,private projectService:ProjectService) {}
  //..
  mapData : any | null = null;
  showError: boolean = false; // To track if an error message should be shown

  listedRobo : any[]=[];
  availableRobots : any[]=[];



  async ngOnInit(){
    if(!this.mapName) return;
    let res1 = await fetch(`http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${this.mapName}`,{
      method:'GET',
      credentials:'include'
    });
    let mapData = await res1.json();

    let response = await fetch(`http://${environment.API_URL}:${environment.PORT}/robo-configuration/get-robos/${mapData.map._id}`, {
      method: 'GET',
      credentials: 'include'
    });
    let data = await response.json();
    this.listedRobo = data.populatedRobos;
    let id = 0;
    this.availableRobots = data.populatedRobos.map((robo : any)=>{
      id++;
      return {
        id : id,
        roboId : robo._id.toString().slice(18),
        roboName : robo.roboName,
        ipAdd : robo.ipAdd,
        selected : true,
      }
    })
    // console.log(this.availableRobots);
  }

  closePopup() {
    this.resetSelections(); // Reset the selections when the popup is closed
    this.close.emit();
  }

  addSelectedRobots() {
    const selectedRobots = this.availableRobots.filter((robot) => robot.selected);

    if (selectedRobots.length > 0) {
      this.addRobot.emit(selectedRobots); // Emit all selected robots
      this.showError = false;

      // Show success toast message
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Robots added successfully!'
      });

      this.close.emit();
    } else {
      this.showError = true;

      // Show error toast message
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No robots selected!'
      });
    }

    this.resetSelections();
  }

  private resetSelections() {
    this.availableRobots.forEach((robot) => {
      robot.selected = false;
    });
  }
}
