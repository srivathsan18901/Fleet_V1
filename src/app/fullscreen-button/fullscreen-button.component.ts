import { Component } from '@angular/core';

@Component({
  selector: 'app-fullscreen-button',
  templateUrl: './fullscreen-button.component.html',
  styleUrl: './fullscreen-button.component.css'
})
export class FullscreenButtonComponent {
  isFullscreen = false;

  toggleFullscreen() {
    const elem = document.documentElement;
  
    if (!document.fullscreenElement) {
      // Enter fullscreen
      elem.requestFullscreen?.();
    } else {
      // Exit fullscreen
      document.exitFullscreen?.();
    }
  }
}
