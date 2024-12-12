import { Component, EventEmitter, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
@Component({
  selector: 'app-robot-parameters-popup',
  templateUrl: './robot-parameters-popup.component.html',
  styleUrl: './robot-parameters-popup.component.css',
})
export class RobotParametersPopupComponent {
  @Output() close = new EventEmitter<void>();
  activeTab: string = 'move';

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  closeRobotpara() {
    this.close.emit(); // Emit an event to notify the parent to close the popup
  }
}
