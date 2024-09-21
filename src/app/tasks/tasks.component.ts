import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ExportService } from '../export.service';
import { environment } from '../../environments/environment.development';
import { ProjectService } from '../services/project.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css'],
})
export class TasksComponent implements OnInit, AfterViewInit {
  i: any;
  // activeButton: number | null = null;

  // handleClick(index: number): void {
  //   this.activeButton = index;

  // }
  trackByTaskId(index: number, item: any): number {
    return item.taskId; // or any unique identifier like taskId
  }
  onPause(item: any) {
    // Toggle the paused state of the task
    item.paused = !item.paused;

    // Log the pause/activate action for the clicked item
    const action = item.paused ? 'Paused' : 'Activated';
    console.log(`${action} task: ${item.taskId}`);
  }

  onCancel(item: any) {
    // Find the index of the item in the tasks array and remove it
    const index = this.tasks.indexOf(item);
    if (index > -1) {
      this.tasks.splice(index, 1); // Remove the task from the tasks array
    }

    // Update the filteredTaskData and reapply pagination
    this.filteredTaskData = [...this.tasks]; // Ensure it's updated
    this.setPaginatedData(); // Recalculate the displayed paginated data
  }

  mapData: any | null = null;
  searchQuery: string = '';
  isPopupVisible: boolean = false;

  tasks: any[] = [];

  filteredTaskData: any[] = [];
  paginatedData: any[] = [];

  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  constructor(
    private exportService: ExportService,
    private projectService: ProjectService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    this.mapData = this.projectService.getMapData();
    if (!this.mapData) return;
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-tasks`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapId: this.mapData.id,
          timeStamp1: '',
          timeStamp2: '',
        }),
      }
    );
    // if (!response.ok)
    //   throw new Error(`Error with status code of : ${response.status}`);
    let data = await response.json();
    const { tasks } = data;
    this.tasks = tasks.map((task: any) => {
      return {
        taskId: task.task_id,
        taskName: task.sub_task[0]?.task_type
          ? task.sub_task[0]?.task_type
          : 'N/A',
        status: task.task_status.status,
        roboName: task.agent_name,
        sourceDestination: task.sub_task[0]?.source_location
          ? task.sub_task[0]?.source_location
          : 'N/A',
      };
    });
    this.filteredTaskData = this.tasks;
    this.setPaginatedData();
  }

  // Ensure the paginator is initialized before setting paginated data
  ngAfterViewInit() {
    //   this.setPaginatedData(); // Set initial paginated data after view is initialized
  }

  setPaginatedData() {
    if (this.paginator) {
      const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
      this.paginatedData = this.filteredTaskData.slice(
        startIndex,
        startIndex + this.paginator.pageSize
      );
    }
  }

  onPageChange(event: PageEvent) {
    this.setPaginatedData();
  }

  // Search method
  onSearch(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value.toLowerCase();

    if (!inputValue) {
      this.filteredTaskData = this.tasks;
    } else {
      this.filteredTaskData = this.tasks.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(inputValue)
        )
      );
    }

    // Reset the paginator after filtering
    if (this.paginator) {
      this.paginator.firstPage();
    }

    this.setPaginatedData(); // Update paginated data after filtering
  }
  exportData(format: string) {
    const data = this.tasks;

    try {
      switch (format) {
        case 'csv':
          this.exportService.exportToCSV(data, 'TaskDataExport');
          this.messageService.add({
            severity: 'success',
            summary: 'Export Successful',
            detail: 'Data exported to CSV successfully!',
            life: 3000,
          });
          break;
        case 'excel':
          this.exportService.exportToExcel(data, 'TaskDataExport');
          this.messageService.add({
            severity: 'success',
            summary: 'Export Successful',
            detail: 'Data exported to Excel successfully!',
            life: 3000,
          });
          break;
        case 'pdf':
          this.exportService.exportToPDF(data, 'TaskDataExport');
          this.messageService.add({
            severity: 'success',
            summary: 'Export Successful',
            detail: 'Data exported to PDF successfully!',
            life: 3000,
          });
          break;
        default:
          console.error('Invalid export format');
          this.messageService.add({
            severity: 'error',
            summary: 'Export Failed',
            detail: 'Invalid export format specified.',
            life: 3000,
          });
      }
    } catch (error) {
      console.error('Export error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Export Failed',
        detail: 'An error occurred while exporting data.',
        life: 3000,
      });
    }
  }

  showPopup() {
    this.isPopupVisible = true;
  }

  onClose() {
    this.isPopupVisible = false;
  }
}
