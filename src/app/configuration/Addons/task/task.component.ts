import { Component } from '@angular/core';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrl: './task.component.css'
})
export class TaskComponent {
  categories: any[] = [
    { name: 'FIFO', key: 'A' },
    { name: 'LP', key: 'B' },
  ];

  selectedCategory: any = null; // Ensure no selection initially

  ngOnInit() {
    // Optionally, set the selectedCategory programmatically later if needed
    // For example, you might set it based on some condition or user action
    // this.selectedCategory = this.categories[1]; // Uncomment if you need to select a category later
  }

  selectCategory(category: any) {
    this.selectedCategory = category; // Method to select a category programmatically
  }
}
