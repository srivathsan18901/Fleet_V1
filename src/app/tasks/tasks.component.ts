import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ExportService } from '../export.service';
import { environment } from '../../environments/environment.development';
import { ProjectService } from '../services/project.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MessageService } from 'primeng/api';
import { TranslationService } from '../services/translation.service';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { map, Subscription } from 'rxjs';
import { IsFleetService } from '../services/shared/is-fleet.service';
import { NodeGraphService } from '../services/nodegraph.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css'],
})
export class TasksComponent implements OnInit, AfterViewInit {
  i: any;
  uniqueRobotNames: string[] = [];
  mapData: any | null = null;
  searchQuery: string = '';
  isPopupVisible: boolean = false;
  tasks: any[] = [];
  robotList: number[] = [];
  filteredTaskData: any[] = [];
  paginatedData: any[] = [];
  selectedStatus: string = '';
  selectedRobot: string = '';
  private langSubscription!: Subscription;
  onRobotFilter(event: any) {
    this.selectedRobot = event.target.value;
    this.applyFilters();
  }
  applyFilters() {
    this.filteredTaskData = this.tasks.filter((task: any) => {
      const statusMatch = this.selectedStatus
        ? task.status === this.selectedStatus
        : true;
      const robotMatch = this.selectedRobot
        ? task.roboName === this.selectedRobot
        : true;
      return statusMatch && robotMatch;
    });
    this.setPaginatedData(); // Update paginated data based on filtered results
  }
  expandedRowMap: { [key: string]: boolean } = {}; // Track expanded rows
  expandedRowId: string | null = null; // Track the currently open row
  
  // Mapping statuses to step index
  statusStepMap: { [key: string]: number } = {
    NOTASSIGNED: 0,
    ASSIGNED: 1,
    INPROGRESS: 2,
    COMPLETED: 3
  };
  
  // Default steps
  defaultSteps = [
    { label: this.getTranslation('Not Assigned'), icon: '../../assets/Iconsfortask/NA.svg' },
    { label: this.getTranslation('assigned'), icon: '../../assets/Iconsfortask/Ass.svg' },
    { label: this.getTranslation('In Progress'), icon: '../../assets/Iconsfortask/IP.svg' },
    { label: this.getTranslation('Completed'), icon: '../../assets/Iconsfortask/Comp.svg' }
  ];
  
  // Function to get steps with cancellation tracking
  getSteps(item: any) {
    let steps = [...this.defaultSteps];
  
    if (item.status === 'CANCELLED') {
      const prevStep = this.getPreviousStep(item); // Get previous step index
      steps[prevStep] = { label: this.getTranslation('Cancelled'), icon: '../../assets/Iconsfortask/Canc.svg' }; // Replace previous step with "Cancelled"
    }
  
    return steps;
  }
  
  // Function to determine the current step based on item.status
  getCurrentStep(item: any): number {
    if (item.status === 'CANCELLED') {
      return this.getPreviousStep(item); // Set active step to the last valid step before cancellation
    }
    return this.statusStepMap[item.status] ?? 0;
  }
  
  // Function to get the last step before cancellation
  getPreviousStep(item: any): number {
    if (item.previousStatus) {
      return this.statusStepMap[item.previousStatus] ?? 3;
    }
    return 3;
  }
  
  // Toggle row expansion
  toggleDetails(item: any) {
    if (this.expandedRowId === item.taskId) {
      this.expandedRowMap[item.taskId] = false;
      this.expandedRowId = null;
    } else {
      if (this.expandedRowId) {
        this.expandedRowMap[this.expandedRowId] = false;
      }
      this.expandedRowMap[item.taskId] = true;
      this.expandedRowId = item.taskId;
    }
  }
  
  trackByTaskId(index: number, item: any) {
    return item.taskId;
  }
  
  
  clearFilters() {
    this.selectedStatus = '';
    this.selectedRobot = '';

    // Reset the value of the select elements
    const statusFilterElement = document.getElementById(
      'status-filter'
    ) as HTMLSelectElement;
    const robotFilterElement = document.getElementById(
      'robot-filter'
    ) as HTMLSelectElement;

    if (statusFilterElement) statusFilterElement.value = '';
    if (robotFilterElement) robotFilterElement.value = '';

    // Reapply filters to display all data
    this.applyFilters();
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

  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  constructor(
    private exportService: ExportService,
    private projectService: ProjectService,
    private messageService: MessageService,
    private translationService: TranslationService,
    private paginatorIntl: MatPaginatorIntl,
    private isFleetService: IsFleetService,
    private router: Router,
    private nodeGraphService: NodeGraphService,
  ) {}
  getTranslation(key: string) {
    return this.translationService.getTasksTranslation(key);
  }

  async ngOnInit() {
    this.mapData = this.projectService.getMapData();
    let establishedTime = new Date(this.mapData.createdAt); // created time of map..
    let { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay(establishedTime);
    // timeStamp1 = 1728930600;
    // timeStamp2 = 1729050704;
    this.paginatorIntl.itemsPerPageLabel =
      this.getTranslation('Items per page'); // Modify the text
    this.paginatorIntl.changes.next();
    this.langSubscription = this.translationService.currentLanguage$.subscribe(
      (val) => {
        this.defaultSteps = [
          { label: this.getTranslation('Not Assigned'), icon: '../../assets/Iconsfortask/NA.svg' },
          { label: this.getTranslation('assigned'), icon: '../../assets/Iconsfortask/Ass.svg' },
          { label: this.getTranslation('In Progress'), icon: '../../assets/Iconsfortask/IP.svg' },
          { label: this.getTranslation('Completed'), icon: '../../assets/Iconsfortask/Comp.svg' }
        ];
        this.paginatorIntl.itemsPerPageLabel = this.getTranslation('Items per page');
        this.paginatorIntl.changes.next();
      }
    );
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
    let data = await response.json();
    console.log(data, 'task data');
    if (!data.tasks) return;
    const { tasks } = data.tasks;

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

    let grossFactSheet = await this.fetchAllRobos();
    this.isFleetService.isFleet$.subscribe(async (status: boolean) => {
      // this.isFleet = status; // Update the value whenever it changes
      if (status)
        this.robotList = grossFactSheet.map((robo) => {
          return robo.id;
        });
      else this.robotList = await this.getSimRobos();
    });

    this.setPaginatedData();
  }
  async toggleAssignTask() {
    this.router.navigate(['/dashboard']);
    if (this.nodeGraphService.getAssignTask()) {
      this.messageService.add({
        severity: 'info',
        summary: this.getTranslation('Enabled Task Assigning'),
        detail: this.getTranslation('Task Assigning Option has been Enabled'),
        life: 2000,
      });
    }
  }

  // Ensure the paginator is initialized before setting paginated data
  ngAfterViewInit() {
    this.setPaginatedData(); // Set initial paginated data after view is initialized
  }

  async getSimRobos(): Promise<number[]> {
    if (!this.mapData) return [];
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${this.mapData.mapName}`
    );
    if (!response.ok)
      throw new Error(`Error with status code of ${response.status}`);
    let data = await response.json();
    if (!data.map) return [];
    let map = data.map;

    let simMode = map.simMode.map((robo: any) => {
      return robo.amrId;
    });
    return simMode;
  }

  async fetchAllRobos(): Promise<any[]> {
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/stream-data/get-fms-amrs`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapId: this.mapData.id }),
      }
    );

    const data = await response.json();
    return data.robots || [];
  }

  isDisabled(status: string): boolean {
    return (
      status === 'COMPLETED' || status === 'CANCELLED' || status === 'FAILED'
    ); // || status === 'INPROGRESS'
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

  assignRobot(task: any) {
    if (task.selectedRobot) {
      // task.roboName = task.selectedRobot; // Assign the robot name
      // task.status = 'ASSIGNED'; // Update status
    }
    this.cancelAssign(task)
  }
  cancelAssign(item: any){
    item.showDropdown = false;  
    item.showReassDropdown = false; 
  }
  toggleDropdown(task: any) {
    task.showDropdown = true;
  }
  reassignRobot(item: any) { 
    item.selectedRobot = '';
    item.showReassDropdown = true;      // Clear the previously assigned robot
    // console.log(`Re-assigned Task ID: ${item.taskId}`);
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
}
