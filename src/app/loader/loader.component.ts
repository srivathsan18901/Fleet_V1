import { Component } from '@angular/core';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.css'
})
export class LoaderComponent {

  isLoading = false;

  // Example method to simulate page load or API call
  ngOnInit() {
    // Simulate some delay, such as an API call
    setTimeout(() => {
      this.isLoading = false; // Hide loader after the delay
    }, 2000); // Delay of 3 seconds
  }

}
