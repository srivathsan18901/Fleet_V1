import { Component } from '@angular/core';

@Component({
  selector: 'app-communication',
  templateUrl: './communication.component.html',
  styleUrl: './communication.component.css'
})
export class CommunicationComponent {
  categories: any[] = [
    { name: 'FastDDS', key: 'A' },
    { name: 'MarkFastDDSNATeting', key: 'M' },
    { name: 'Simulation', key: 'P' },
    { name: 'SimulationSocket', key: 'R' },
    { name: 'Socket', key: 'S' },
    { name: 'MQTT', key: 'Q' },
  ];

  selectedCategory: any = null; // No initial selection

  ngOnInit() {
    // Optionally, set the selectedCategory programmatically later if needed
    // For example, you might set it based on some condition or user action
    // this.selectedCategory = this.categories[1]; // Uncomment if you need to select a category later
  }

  selectCategory(category: any) {
    this.selectedCategory = category; // Method to select a category programmatically
  }
}
