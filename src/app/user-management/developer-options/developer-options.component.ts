import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
  selector: 'app-developer-options',
  templateUrl: './developer-options.component.html',
  styleUrls: ['./developer-options.component.css'],
})
export class DeveloperOptionsComponent implements OnInit {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

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
}
