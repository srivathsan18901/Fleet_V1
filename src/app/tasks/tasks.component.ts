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

  async onCancel(item: any) {
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-tasks/cancel-task`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapId: this.mapData.id,
          taskId: item.taskId,
        }),
      }
    );
    let data = await response.json();
    console.log(item);

    if (!data.isTaskCancelled) {
      alert(data.response || data.msg);
      return;
    }
    if (data.isTaskCancelled) {
      this.messageService.add({
        severity: 'info',
        summary: 'Info',
        detail: 'Task Cancelled',
      });
      await this.refreshTaskData();
    }
  }
  async refreshTaskData() {
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-tasks`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapId: this.mapData.id,
          timeStamp1: this.getTimeStampsOfDay(new Date(this.mapData.createdAt))
            .timeStamp1,
          timeStamp2: this.getTimeStampsOfDay(new Date(this.mapData.createdAt))
            .timeStamp2,
        }),
      }
    );

    let data = await response.json();

    if (data.tasks) {
      const { tasks } = data.tasks;
      this.tasks = tasks.map((task: any) => ({
        taskId: task.task_id,
        taskType: task.sub_task[0]?.task_type || 'N/A',
        status: task.task_status.status,
        roboName: task.agent_ID,
        sourceLocation: task.sub_task[0]?.source_location || 'N/A',
        destinationLocation: 'N/A',
      }));
      this.filteredTaskData = this.tasks;
      this.updateData(); // Ensure pagination and filtered data are updated
    }
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
    let establishedTime = new Date(this.mapData.createdAt); // created time of map..
    let { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay(establishedTime);
    // timeStamp1 = 1728930600;
    // timeStamp2 = 1729050704;

    if (!this.mapData) return;
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-tasks`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapId: this.mapData.id,
          timeStamp1: timeStamp1,
          timeStamp2: timeStamp2,
        }),
      }
    );
    // if (!response.ok)
    //   throw new Error(`Error with status code of : ${response.status}`);
    let data = await response.json();
    console.log(data, 'task data');
    if (!data.tasks) return;
    const { tasks } = data.tasks;
    if (!('tasks' in data.tasks)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Task lists are empty.',
      });
    }

    if (tasks)
      this.tasks = tasks.map((task: any) => {
        // if(task.task_status.status === "COMPLETED")
        return {
          taskId: task.task_id,
          taskType: task.sub_task[0]?.task_type
            ? task.sub_task[0]?.task_type
            : 'N/A',
          status: task.task_status.status,
          roboName: task.agent_ID,
          sourceLocation: task.sub_task[0]?.source_location
            ? task.sub_task[0]?.source_location
            : 'N/A',
          destinationLocation: 'N/A',
        };
      });
    this.filteredTaskData = this.tasks;
    // console.log(this.tasks);
    this.setPaginatedData();

    // Simulate some delay, such as an API call
  }

  // Ensure the paginator is initialized before setting paginated data
  ngAfterViewInit() {
    this.setPaginatedData(); // Set initial paginated data after view is initialized
  }
  isDisabled(status: string): boolean {
    return status === 'COMPLETED' || status === 'CANCELLED' || status === 'FAILED';
  }
  
  getTimeStampsOfDay(establishedTime: Date) {
    let currentTime = Math.floor(new Date().getTime() / 1000);
    let startTimeOfDay = this.getStartOfDay(establishedTime);
    return {
      timeStamp1: startTimeOfDay,
      timeStamp2: currentTime,
    };
  }

  getStartOfDay(establishedTime: Date) {
    return Math.floor(establishedTime.setHours(0, 0, 0) / 1000);
  }

  setPaginatedData() {
    if (this.paginator) {
      const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
      const endIndex = startIndex + this.paginator.pageSize;
      this.paginatedData = this.filteredTaskData.slice(startIndex, endIndex);
    } else {
      this.paginatedData = this.filteredTaskData.slice(0, 5); // Default to first 5 items if paginator is not defined
    }
  }

  shouldShowPaginator(): boolean {
    return this.filteredTaskData.length > 0;
  }

  updateData() {
    // This should be called after data change (e.g., after filtering or sorting)
    if (this.paginator) {
      this.paginator.pageIndex = 0; // Reset to the first page
    }
    this.setPaginatedData(); // Update paginated data
  }

  onPageChange(event: PageEvent) {
    this.setPaginatedData();
  }
  selectedStatus: string = ''; // New variable

  onStatusFilter(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;

    this.selectedStatus = selectedValue; // Store selected status
    this.filterTasks(); // Filter tasks based on selected status
  }

  filterTasks(): void {
    // Filter by search query
    this.filteredTaskData = this.tasks.filter((task) => {
      const matchesSearchQuery =
        this.searchQuery.trim().length === 0 ||
        Object.values(task).some((val) =>
          String(val).toLowerCase().includes(this.searchQuery.toLowerCase())
        );

      // Filter by selected status if any
      const matchesStatus =
        this.selectedStatus.trim().length === 0 ||
        task.status === this.selectedStatus;

      return matchesSearchQuery && matchesStatus;
    });

    // Reset the paginator and update paginated data
    if (this.paginator) {
      this.paginator.firstPage();
    }

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
          let csvHeader: { [k: string]: any } = {};
          if (data.length == 0) {
            csvHeader['status'] = true;
            csvHeader['structure'] = [
              {
                taskId: '',
                taskType: '',
                status: '',
                roboName: '',
                sourceLocation: '',
                destinationLocation: '',
              },
            ];
          }
          csvHeader['length'] = 6;
          // console.log(data,'excel task cmptdata')
          this.exportService.exportToCSV(data, 'TaskDataExport', csvHeader);
          this.messageService.add({
            severity: 'success',
            summary: 'Export Successful',
            detail: 'Data exported to CSV successfully!',
            life: 3000,
          });
          break;
        case 'excel':
          let excelHeader: { [k: string]: any } = {};
          if (data.length == 0) {
            excelHeader['status'] = true;
            excelHeader['structure'] = [
              {
                taskId: '',
                taskType: '',
                status: '',
                roboName: '',
                sourceLocation: '',
                destinationLocation: '',
              },
            ];
          }
          excelHeader['length'] = 6;
          this.exportService.exportToExcel(data, 'TaskDataExport', excelHeader);
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

  // cancel popup
}
