import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

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

  options = [
    'Live Indicator',
    'Zoom In & Out',
    'Full Screen',
    'Pan option',
    'Fleet / Simulation',
    'Capture option',
    'Notification',
    'Screen Recording',
    'Profile Popup',
    'Dashboard',
  ];

  toggles: { [key: string]: boolean } = {};

  ngOnInit() {
    this.options.forEach((option) => {
      const stored = localStorage.getItem(this.getKey(option));
      this.toggles[option] = stored === 'true';
    });
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
}