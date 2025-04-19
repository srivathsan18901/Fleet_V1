import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  HostListener,
  ElementRef,
} from '@angular/core';
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
  nodata: string = '';
  autoRefreshInterval: any;
  taskData: any;
  liveTasksInterval: ReturnType<typeof setInterval> | null = null;
  tasksSignalController: AbortController | null = null;
  isFilterPopupVisible = false;
  filterOptions = {
    startDateTime: '',
    endDateTime: '',
    taskType: '',
    status: '',
    robotId: ''
  };
  originalTaskData = []; // Store the original unfiltered data
  private langSubscription!: Subscription;
  isFirstLoad: boolean = false;
  isLoading: boolean = false;

  isFilterApplied: boolean = false;
  isOnSearchApplied: boolean = false;
  isTaskDropDowned: boolean = false;

  expandedRowMap: { [key: string]: boolean } = {}; // Track expanded rows
  expandedRowId: string | null = null; // Track the currently open row

  robos: any[] = [];
  simRobos: any[] = [];

  // Mapping statuses to step index
  statusStepMap: { [key: string]: number } = {
    NOTASSIGNED: 0,
    ASSIGNED: 1,
    INPROGRESS: 2,
    COMPLETED: 3,
  };

  // Default steps
  defaultSteps = [
    {
      label: this.getTranslation('Not Assigned'),
      icon: '../../assets/Iconsfortask/NA.svg',
    },
    {
      label: this.getTranslation('assigned'),
      icon: '../../assets/Iconsfortask/Ass.svg',
    },
    {
      label: this.getTranslation('In Progress'),
      icon: '../../assets/Iconsfortask/IP.svg',
    },
    {
      label: this.getTranslation('Completed'),
      icon: '../../assets/Iconsfortask/Comp.svg',
    },
  ];

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
    private cdRef: ChangeDetectorRef,
    private eRef: ElementRef
  ) {
    this.filteredTaskData = [];
  }

  async ngOnInit() {
    if (!JSON.parse(this.projectService.getInitializeMapSelected()))
      this.isButtonDisabled = false;
    this.mapData = this.projectService.getMapData();

    if (!this.mapData) this.nodata = this.getTranslation('no_map_selected');
    else this.nodata = this.getTranslation('No data found');

    this.paginatorIntl.itemsPerPageLabel =
      this.getTranslation('Items per page'); // Modify the text
    this.paginatorIntl.changes.next();
    this.langSubscription = this.translationService.currentLanguage$.subscribe(
      (val) => {
        this.defaultSteps = [
          {
            label: this.getTranslation('Not Assigned'),
            icon: '../../assets/Iconsfortask/NA.svg',
          },
          {
            label: this.getTranslation('assigned'),
            icon: '../../assets/Iconsfortask/Ass.svg',
          },
          {
            label: this.getTranslation('In Progress'),
            icon: '../../assets/Iconsfortask/IP.svg',
          },
          {
            label: this.getTranslation('Completed'),
            icon: '../../assets/Iconsfortask/Comp.svg',
          },
        ];
        this.paginatorIntl.itemsPerPageLabel =
          this.getTranslation('Items per page');
        this.paginatorIntl.changes.next();
      }
    );
    if (!this.mapData) return;
    await this.fetchTasks();

    this.robos = await this.fetchAllRobos();
    this.simRobos = await this.getSimRobos();

    this.isFleetService.isFleet$.subscribe((status: boolean) => {
      if (status) this.robotList = this.robos.map((robo) => robo.id);
      else this.robotList = this.simRobos;
      console.log(this.robotList);
    });

    this.liveTasksInterval = setInterval(async () => {
      await this.fetchTasks();
    }, 1000 * 4);

    // Auto-update search and filters every second
    // this.autoRefreshInterval = setInterval(() => {
    //   this.autoRefreshTasks();
    // }, 1000);
  }

  openFilterPopup() {
    this.isFilterPopupVisible = !this.isFilterPopupVisible;
  }

  closeFilterPopup() {
    this.isFilterPopupVisible = false;
  }
  isButtonDisabled: boolean = true;

  getTranslation(key: string) {
    return this.translationService.getTasksTranslation(key);
  }

  onRobotFilter(event: any) {
    this.selectedRobot = event.target.value;
    this.applyFilters();
  }

  applyFilters() {
    // Validate date range
    if (this.filterOptions.startDateTime && this.filterOptions.endDateTime) {
      const startDate = new Date(this.filterOptions.startDateTime);
      const endDate = new Date(this.filterOptions.endDateTime);

      if (endDate < startDate) {
        this.messageService.add({
          severity: 'error',
          summary: 'Invalid Date Range',
          detail: 'End date/time cannot be before start date/time',
          life: 3000,
        });
        return; // Don't apply filters if validation fails
      }
    }

    this.filteredTaskData = this.tasks.filter((task: any) => {
      // Convert task timestamp to Date object for comparison
      const taskDate = new Date(task.TimeStamp);

      // Date Range Filter
      const dateMatch =
        (!this.filterOptions.startDateTime ||
          taskDate >= new Date(this.filterOptions.startDateTime)) &&
        (!this.filterOptions.endDateTime ||
          taskDate <= new Date(this.filterOptions.endDateTime));

      // Status Filter
      const statusMatch =
        !this.filterOptions.status || task.status === this.filterOptions.status;

      // Robot Filter (if you have this field)
      const robotMatch = 
      !this.filterOptions.robotId || 
      task.roboName == this.filterOptions.robotId;

      return dateMatch && statusMatch && robotMatch;
    });

    this.isFilterApplied = true;
    this.setPaginatedData();
    this.closeFilterPopup(); // Close the popup after applying filters
  }

  // Function to get steps with cancellation tracking
  getSteps(item: any) {
    let steps = [...this.defaultSteps];

    if (item.status === 'CANCELLED') {
      const prevStep = this.getPreviousStep(item); // Get previous step index
      steps[prevStep] = {
        label: this.getTranslation('Cancelled'),
        icon: '../../assets/Iconsfortask/Canc.svg',
      }; // Replace previous step with "Cancelled"
    }
    return steps;
  }

  // Function to determine the current step based on item.status
  getCurrentStep(item: any): number {
    if (item.status === 'CANCELLED') {
      return this.getPreviousStep(item); // Set active step to the last valid step before cancellation
    }
    if (item.status === 'ACCEPTED') return this.statusStepMap['ASSIGNED'];
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

  // Listen for clicks outside the table to close the expanded row
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    if (
      !this.eRef.nativeElement
        .querySelector('.table-container')
        ?.contains(event.target as Node)
    ) {
      // If click is outside the table, close the expanded row
      if (this.expandedRowId) {
        this.expandedRowMap[this.expandedRowId] = false;
        this.expandedRowId = null;
      }
    }
  }
  trackByTaskId(index: number, item: any) {
    return item.taskId;
  }

  clearFilters() {
    this.filterOptions = {
      startDateTime: '',
      endDateTime: '',
      taskType: '',
      status: '',
      robotId: ''
    };
    this.searchQuery = '';
    this.selectedRobot = '';
    this.selectedStatus = '';
    this.isFilterApplied = false;

    // Reset the filtered data to show all tasks
    this.filteredTaskData = [...this.tasks];
    this.setPaginatedData();

    // Close the filter popup if open
    this.closeFilterPopup();
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
      this.messageService.add({
        severity: 'info',

        detail: data.response || data.msg,
      });
      // alert(data.response || data.msg);
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
    // console.log(data);

    let sNo = 1;
    if (data.tasks) {
      const { tasks } = data.tasks;
      this.tasks = tasks.map((task: any) => ({
        sNo: sNo++,
        taskId: task.task_id,
        taskType: task.sub_task[0]?.task_type || 'N/A',
        status: task.task_status.status,
        roboName: task.agent_ID,
        destinationLocation: task.sub_task[0]?.source_location || 'N/A',
      }));
      // this.filteredTaskData = this.tasks;
      this.updateData(); // Ensure pagination and filtered data are updated
      this.taskData = this.tasks;
      console.log(this.taskData, 'taskdata');
    }
  }

  autoRefreshTasks() {
    if (this.isFilterApplied || this.isOnSearchApplied ) {
      this.filterTasks(); // Reapply filters
    } else {
      this.setPaginatedData(); // Just update the paginated data
    }
  }

  async fetchTasks() {
    try {
      if (this.tasksSignalController) this.tasksSignalController.abort();
      this.tasksSignalController = new AbortController();
  
      if (this.isFirstLoad) this.isLoading = true;
  
      let establishedTime = new Date(this.mapData.createdAt); // created time of map..
      let { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay(establishedTime);
  
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
          signal: this.tasksSignalController.signal,
        }
      );
  
      let data = await response.json();
      if (!data.tasks || data.error) return;
  
      const { tasks } = data.tasks;
      let sNo = 1;
  
      if (tasks) {
        this.tasks = tasks.map((task: any) => {
          let TimeStamp = new Date(task.TimeStamp * 1000);
          let formattedTimeStamp =
            TimeStamp.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }) +
            ', ' +
            TimeStamp.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });
  
          return {
            sNo: sNo++,
            taskId: task.task_id,
            taskType: task.task_type,
            status: task.task_status.status,
            robotID: task.agent_ID,
            TimeStamp: formattedTimeStamp,
            destinationLocation: task.source_location || 'N/A',
          };
        });
      }
  
      if (this.isFilterApplied || this.isOnSearchApplied) {
        this.filteredTaskData = this.filteredTaskData.filter((updatedTask) => {
          return this.tasks.some((task) => task.taskId === updatedTask.taskId);
        });
  
        this.setPaginatedData();
      } else if (!this.isFilterApplied && !this.isOnSearchApplied) {
        this.filteredTaskData = this.tasks;
        this.setPaginatedData();
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      if (this.isFirstLoad) {
        this.isLoading = false;
        this.isFirstLoad = false;
      }
    }
  }

  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16); // Formats to "YYYY-MM-DDTHH:MM"
  }
  async toggleAssignTask() {
    this.nodeGraphService.setLocalize(false);
    this.nodeGraphService.setAssignTask(true);
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

  async assignRobot(task: any) {
    if (task.selectedRobot) {
      // task.roboName = task.selectedRobot; // Assign the robot name
      // task.status = 'ASSIGNED'; // Update status
      let bodyData = {
        taskId: task.taskId,
        robotId: parseInt(task.selectedRobot),
      };
      let isTaskAssigned = await this.assignTask(bodyData);
      if (isTaskAssigned) task.status = 'ASSIGNED';
    }
    this.cancelAssign(task);
  }

  async assignTask(bodyData: any): Promise<boolean> {
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-tasks/assign-task`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      }
    );

    let data = await response.json();
    console.log(data);
    if (data.taskAssigned) {
      this.messageService.add({
        severity: 'info',
        summary: 'Info',
        detail: 'Task Sent',
      });
      return true;
    }
    // if (data.error) return false;
    return false;
  }

  cancelAssign(item: any) {
    item.showDropdown = false;
    item.showReassDropdown = false;
    this.isTaskDropDowned = false;
  }

  toggleDropdown(item: any) {
    // console.log(item.selectedRobot);
    item.selectedRobot = '';
    item.showDropdown = true;
    this.isTaskDropDowned = true;
  }

  reassignRobot(item: any) {
    item.selectedRobot = '';
    item.showReassDropdown = true; // Clear the previously assigned robot
    // console.log(`Re-assigned Task ID: ${item.taskId}`);
    this.isTaskDropDowned = true;
  }

  shouldShowPaginator(): boolean {
    return this.filteredTaskData.length > 0;
  }

  updateData() {
    // This should be called after data change (e.g., after filtering or sorting)
    // if (this.paginator) {
    //   this.paginator.pageIndex = 0; // Reset to the first page
    // }
    // this.setPaginatedData(); // Update paginated data
    //...
    if (
      this.isFilterApplied ||
      this.isOnSearchApplied
      // !this.isTaskDropDowned
    ) {
      this.filteredTaskData = this.tasks.filter((updatedTask) => {
        for (let task of this.filteredTaskData) {
          if (task.taskId == updatedTask.taskId) return true;
        }
        return false;
      });
      this.setPaginatedData();
    }
    // else
    else if (
      !this.isFilterApplied &&
      !this.isOnSearchApplied
      // !this.isTaskDropDowned
    ) {
      this.filteredTaskData = this.tasks;
      this.setPaginatedData();
    }
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

    if (!this.isFilterApplied) this.isFilterApplied = true;

    // Reset the paginator and update paginated data
    if (this.paginator) {
      this.paginator.firstPage();
    }

    this.setPaginatedData();
  }
  // Search method
  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value.toLowerCase();
    this.filterTasks(); // Call filterTasks to apply search and filter together
  }

  exportData(format: string) {
    const data = this.tasks.map(item => ({
      ...item,
      robotID: item.robotID < 0 ? "--" : item.robotID // or item.robotID if that's the field name
    }));

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
                robotID: '',
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
                robotID: '',
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

  ngOnDestroy() {
    if (this.liveTasksInterval) clearInterval(this.liveTasksInterval);
  }
}
