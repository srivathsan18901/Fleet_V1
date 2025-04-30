import { Component, Input, Output, EventEmitter, OnInit, ElementRef, Renderer2 } from '@angular/core';

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

  constructor(private el: ElementRef, private renderer: Renderer2) {}

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
    return `assets/images/${key}.png`;
  }

  onInfoMouseEnter(event: MouseEvent, option: string) {
    this.hoveredOption = option;

    const iconRect = (event.target as HTMLElement).getBoundingClientRect();
    const dialogContent = this.el.nativeElement.querySelector('.p-dialog-content');
    const dialogRect = dialogContent.getBoundingClientRect();

    const popupWidth = 200; // Approximate popup width
    const popupHeight = 150; // Approximate popup height
    const margin = 10; // Margin from the icon

    let left = iconRect.right - dialogRect.left + margin;
    let top = iconRect.top - dialogRect.top;

    // Adjust horizontally to stay within dialog bounds
    if (left + popupWidth > dialogRect.width) {
      left = iconRect.left - dialogRect.left - popupWidth - margin;
    }

    // Adjust vertically to stay within dialog bounds
    if (top + popupHeight > dialogRect.height) {
      top = dialogRect.height - popupHeight - margin;
    }

    // Ensure popup doesn't go off the top or left
    top = Math.max(margin, top);
    left = Math.max(margin, left);

    this.popupPosition = {
      top: `${top}px`,
      left: `${left}px`,
    };
  }

  onInfoMouseLeave() {
    // Delay closing to allow hover on popup
    setTimeout(() => {
      if (!this.el.nativeElement.querySelector('.hover-popup:hover')) {
        this.hoveredOption = null;
      }
    }, 100);
  }

  onPopupMouseEnter(option: string) {
    this.hoveredOption = option;
  }

  onPopupMouseLeave() {
    this.hoveredOption = null;
  }
}