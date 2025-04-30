import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-developer-options',
  templateUrl: './developer-options.component.html',
  styleUrls: ['./developer-options.component.css'],
})
export class DeveloperOptionsComponent implements OnInit {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  popupPosition = { top: '0px', left: '0px' };
  hoveredOption: string | null = null;
  selectedSidebar = 'Dashboard'; // Default selected section

  
  sidebarItems = ['Dashboard', 'Statistics', 'Robots', 'Configuration', 'Error Logs', 'Task', 'User Management'];
  
  toggles: { [key: string]: boolean } = {};

  Object = Object; // ✅ expose Object to the template

  sidebarOptionsMap: { [key: string]: string[] } = {
    'Dashboard': ['Live Indicator', 'Zoom In & Out', 'Full Screen', 'Pan option'],
    'Statistics': ['Fleet / Simulation', 'Capture option'],
    'Robots': ['Notification', 'Screen Recording'],
    'Configuration': ['Profile Popup'],
    'Error Logs': ['Error Notifications', 'Debug Mode'],
    'Task': ['Task Manager', 'Task Stats'],
    'User Management': ['User Roles', 'Login Tracking']
  };

  constructor(private messageService: MessageService) {}


  ngOnInit() {
    Object.values(this.sidebarOptionsMap).flat().forEach(option => {
      const stored = localStorage.getItem(this.getKey(option));
      this.toggles[option] = stored === 'true';
    });
  }

  
  get options(): string[] {
    return this.sidebarOptionsMap[this.selectedSidebar] || [];
  }

  toggleOption(option: string) {
    this.toggles[option] = !this.toggles[option];
    localStorage.setItem(this.getKey(option), this.toggles[option].toString());
  }

  close() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

  private getKey(option: string): string {
    return `devOption_${option.replace(/\s+/g, '_').toLowerCase()}`;
  }

  getImageForOption(option: string): string {
    const key = option.replace(/\s+/g, '-').toLowerCase();
    return `assets/images/${key}.png`; // Match image file names accordingly
  }

  onInfoMouseEnter(event: MouseEvent, option: string) {
    this.hoveredOption = option;
  
    const iconRect = (event.target as HTMLElement).getBoundingClientRect();
    const popupWidth = 200; // approximate width of your popup
    const popupHeight = 150; // approximate height
  
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
  
    let left = iconRect.right + 10;
    let top = iconRect.top;
  
    // Flip to left if overflowing
    if (left + popupWidth > viewportWidth) {
      left = iconRect.left - popupWidth - 10;
    }
  
    // Adjust vertically if going off screen
    if (top + popupHeight > viewportHeight) {
      top = viewportHeight - popupHeight - 10;
    }
  
    this.popupPosition = {
      top: `${top}px`,
      left: `${left}px`
    };
  }
  
  onInfoMouseLeave() {
    this.hoveredOption = null;
  }

  updateLocalStorage() {
    Object.entries(this.toggles).forEach(([option, value]) => {
      const key = this.getKey(option);
      localStorage.setItem(key, value.toString());
    });
    this.messageService.add({
      severity: 'success',
      summary: 'Updated',
      detail: 'Settings updated successfully!',
      life: 3000
    });
  }
  
  resetToStoredValues() {
    Object.values(this.sidebarOptionsMap).flat().forEach(option => {
      const stored = localStorage.getItem(this.getKey(option));
      this.toggles[option] = stored === 'true';
    });
    this.messageService.add({
      severity: 'info',
      summary: 'Reset',
      detail: 'Settings have been reset to saved values.',
      life: 3000
    });
  }
}

