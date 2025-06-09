import { environment } from '../../environments/environment.development';
import { ExportService } from '../export.service';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ProjectService } from '../services/project.service';
import { error, timeStamp } from 'console';
// import { PageEvent } from '@angular/material/paginator';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ModeService } from '../dashboard/mode.service';
import { IsFleetService } from '../services/shared/is-fleet.service';
import { Subscription } from 'rxjs';
// import { clearInterval } from 'timers';
import { TranslationService } from '../services/translation.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-userlogs',
  templateUrl: './userlogs.component.html',
  styleUrl: './userlogs.component.css',
})
export class Userlogscomponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  mapData: any | null = null;
  activeFilter: any;
  ONBtn: any;
  currentMode = '';
  searchQuery: string = '';
  searchInput: string = ''; // Add this property to your component class
  isPopupVisible: boolean | undefined;
  isTransitioning: boolean = false;
  activeButton: string = 'task'; // Default active button
  currentTable = 'task';
  currentTab: any;
  filteredErrLogsData: any[] = [];
  initialRoboInfos: any[] = []; // to store data of initial robo details..
  mapDetails: any | null = null;

  errData: any[] = [];
  filteredRobots: any[] = []; // To store filtered robots
  paginatedData: any[] = [];
  roboErr: any[] = [];

  robotList: number[] = [];
  filterApplied: boolean = false;
  isFleet: boolean = false; // Store the emitted value

  robots: any[] = [];
  liveRobos: any[] = [];

  // activeHeaderKey: string = 'Task Logs'; // Store the key instead
  // activeHeader: string = this.getTranslation(this.activeHeaderKey);

  constructor(
    private cdRef: ChangeDetectorRef,
    private exportService: ExportService,
    private projectService: ProjectService,
    private modeService: ModeService,
    private messageService: MessageService,
    private isFleetService: IsFleetService,
    private translationService: TranslationService
  ) {
    this.mapData = this.projectService.getMapData();
  }
  activeHeaderKey: string = 'Task Logs'; // Store the key instead
  activeHeader: string = this.getTranslation(this.activeHeaderKey);
  subHeaderKey: string = 'taskErrorLogs';
  activeSubHeader: any = this.getTranslation(this.subHeaderKey);

  async ngOnInit() {
    this.mapData = this.projectService.getMapData();
    if (!this.mapData) return;

    let grossFactSheet = await this.fetchAllRobos();

    this.isFleetService.isFleet$.subscribe(async (status: boolean) => {
      // this.isFleet = status; // Update the value whenever it changes
      if (status)
        this.robotList = grossFactSheet.map((robo) => {
          return robo.id;
        });
      else this.robotList = await this.getSimRobos();
    });

    this.modeService.currentMode$.subscribe((mode) => {
      this.currentMode = mode;
    });

    const savedIsFleet = sessionStorage.getItem('isFleet');
    if (savedIsFleet !== null) {
      this.isFleet = savedIsFleet === 'true'; // Convert string to boolean
      this.isFleetService.setIsFleet(this.isFleet); // Sync the state with the service
    }

    this.onModeChange(this.currentMode);

    this.showTable('task');
  }

  getTranslation(key: string) {
    return this.translationService.getErrorTranslation(key);
  }
  isFilterPopupVisible = false;
  filterOptions = {
    startDateTime: '',
    endDateTime: '',
    status: '',
    errorCode: '',
    id: '',
  };
  getUniqueErrorCodes(): string[] {
    const codes = new Set<string>();
    this.errData.forEach(item => {
      if (item.Error_Code) {  
        codes.add(item.Error_Code);
      }
    });
    return Array.from(codes).sort();
  }

  openFilterPopup() {
    this.isFilterPopupVisible = !this.isFilterPopupVisible;
  }
  closeFilterPopup() {
    this.isFilterPopupVisible = false;
  }
  getMinDate(): string {
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    return this.formatDateandtimeForInput(fiveYearsAgo);
  }

  getMaxDate(): string {
    const today = new Date();
    return this.formatDateandtimeForInput(today);
  }
applyFilters(
  startDateTime: string,
  endDateTime: string,
  status: string,
  errorCode: string,
  id: string,
  closePopup: boolean = true
) {
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  // Check if both dates are present and end < start
  if (startDateTime && endDateTime && end < start) {
    this.messageService.add({
      severity: 'error',
      summary: 'Invalid Date Range',
      detail: 'End date/time cannot be before start date/time',
      life: 3000,
    });

    // Clear invalid date values from both UI and internal state
    this.filterOptions.startDateTime = '';
    this.filterOptions.endDateTime = '';

    // Clear the actual input fields as well
    const startInput = document.querySelector('input[type="datetime-local"]#startDateTime') as HTMLInputElement;
    const endInput = document.querySelector('input[type="datetime-local"]#endDateTime') as HTMLInputElement;

    if (startInput) startInput.value = '';
    if (endInput) endInput.value = '';

    return; // Stop filter from applying
  }

  // Update filterOptions with current values
  this.filterOptions = {
    startDateTime,
    endDateTime,
    status,
    errorCode,
    id
  };

  this.filterApplied = true;

  this.applyAllFilters();
  if (closePopup) {
    this.closeFilterPopup();
  }
}

clearFilters() {
  // Reset filter options
  this.filterOptions = {
    startDateTime: '',
    endDateTime: '',
    status: '',
    errorCode: '',
    id: '',
  };
  
  this.searchQuery = '';
  this.searchInput = '';
  
  this.filteredErrLogsData = [...this.errData];
  
  if (this.paginator) {
    this.paginator.firstPage();
  }
  this.filterApplied = false;
  this.setPaginatedData();
  this.fetchErrorLogs();
  this.closeFilterPopup();
}
getUniqueIds(): string[] {
  const ids = new Set<string>();
  this.errData.forEach(item => {
    if (item.id) {
      ids.add(item.id);
    }
  });
  return Array.from(ids).sort((a, b) => {
    // Sort numerically if possible, otherwise alphabetically
    return isNaN(Number(a)) ? a.localeCompare(b) : Number(a) - Number(b);
  });
}

// Modify your clearFilters method

  formatDateandtimeForInput(date: Date): string {
    return date.toISOString().slice(0, 16);
  }
  async ngAfterViewInit() {
    this.setPaginatedData();
  }

  fetchRobos() {
    fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${this.mapData.mapName}`,
      { method: 'GET', credentials: 'include' }
    )
      .then((response) => response.json())
      .then((data) => {
        if (!data.map || data.error) return;
        const { map } = data;
        this.robots = map.roboPos;
      });
  }

  showTable(table: string) {
    this.currentTable = table;    
    this.applyFilters(
      this.filterOptions.startDateTime,
      this.filterOptions.endDateTime,
      this.filterOptions.status,
      this.filterOptions.errorCode,
      this.filterOptions.id
    );
    this.fetchErrorLogs();
  }

  taskErrorController: AbortController | null = null;
  robotErrorController: AbortController | null = null;

async fetchErrorLogs() {
  await this.getTaskLogs();

  // Always apply both search & advanced filters
  this.applyAllFilters();

  setTimeout(() => this.fetchErrorLogs(), 4_000);
}


  private formatDate(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  }
  
async getTaskLogs() {
  if (!this.mapData) return;
  let establishedTime = new Date(this.mapData.createdAt);
  let { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay(establishedTime);

  if (this.taskErrorController) this.taskErrorController.abort();
  this.taskErrorController = new AbortController();

  try {
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/err-logs/${this.mapData.id}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: this.currentTable,
          timeStamp1: timeStamp1,
          timeStamp2: timeStamp2,
        }),
        signal: this.taskErrorController.signal,
      }
    );
    let data = await response.json();

    if (!data.map || data.error) return;
    let { errLogs } = data;
    
    this.errData = errLogs.map((error: any) => {
      const errorDate = new Date(error.timestamp * 1000);
      const formattedDate = this.formatDate(errorDate);
      return {
        id: error.id,
        Date_and_Time: formattedDate,
        Error_Code: error.code,
        criticality: error.criticality,
        description: error.description,
        duration_in_Minutes: error.duration,
      };
    });
    
    // Initialize filtered data
    this.filteredErrLogsData = [...this.errData];
    
    // Force change detection and reset paginator after data is loaded
    this.cdRef.detectChanges();
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.setPaginatedData();
  } catch (error) {
    console.error('Error fetching task logs:', error);
  }
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

  setPaginatedData() {
    if (this.paginator) {
      const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
      this.paginatedData = this.filteredErrLogsData.slice(
        startIndex,
        startIndex + this.paginator.pageSize
      );
      // this.paginatedData1 = this.filteredTaskData1.slice(
      //   startIndex,
      //   startIndex + this.paginator.pageSize
      // );
      // this.paginatedData2 = this.filteredTaskData2.slice(
      //   startIndex,
      //   startIndex + this.paginator.pageSize
      // );
    }
  }
applyAllFilters(): void {
  let data = [...this.errData];

  // 1. Basic search filter
  if (this.searchQuery) {
    const sq = this.searchQuery.toLowerCase();
    data = data.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(sq)
      )
    );
  }

  // 2. Advanced filter popup
  if (this.filterApplied) {
    data = data.filter(item => {
      const dt = new Date(item.Date_and_Time);
      const { startDateTime, endDateTime, status, errorCode, id } = this.filterOptions;

      if (startDateTime && dt < new Date(startDateTime)) return false;
      if (endDateTime && dt > new Date(endDateTime)) return false;
      if (status && item.criticality !== status) return false;
      if (errorCode && String(item.Error_Code) !== String(errorCode)) return false;
      if (id && item.id !== id) return false;

      return true;
    });
  }

  this.filteredErrLogsData = data;
  if (this.paginator) this.paginator.firstPage();
  this.setPaginatedData();
}

onSearch(event: Event): void {
  this.searchQuery = (event.target as HTMLInputElement).value;
  this.applyAllFilters();
}

  // Function to reset the search input and data
  resetSearch(): void {
    this.filteredErrLogsData = this.errData;
  }

  // Function to clear the search input when the page changes
  onPageChange(): void {
    this.searchInput = ''; // Clear the search input
    this.resetSearch(); // Reset the data
    this.setPaginatedData(); // Update paginated data
  }

  trackByTaskId(index: number, item: any) {
    return item.taskId; // or any unique identifier like taskId
  }

  onCancel(item: any) {
    // Find the index of the item in the tasks array and remove it
    const index = this.errData.indexOf(item);
    if (index > -1) {
      this.errData.splice(index, 1); // Remove the task from the tasks array
    }

    // Update the filteredTaskData and reapply pagination
    this.filteredErrLogsData = [...this.errData]; // Ensure it's updated
    this.setPaginatedData(); // Recalculate the displayed paginated data
  }

  togglePopup() {
    throw new Error('Method not implemented.');
  }

  onModeChange(newMode: string) {
    this.currentMode = newMode;
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
    // console.log(establishedTime.toLocaleDateString(),'locale')
    return Math.floor(establishedTime.setHours(0, 0, 0) / 1000);
  }

  exportAsPDF() {
    throw new Error('Method not implemented.');
  }

  exportAsExcel() {
    throw new Error('Method not implemented.');
  }

  exportAsCSV() {
    throw new Error('Method not implemented.');
  }

  onTabChange(arg0: string) {
    throw new Error('Method not implemented.');
  }

  getHeaderKey(button: string): string {
    switch (button) {
      case 'task':
        return 'Task Logs';
      case 'robot':
        return 'Robot Logs';
      case 'fleet':
        return 'Fleet Logs';
      default:
        return 'Task Logs';
    }
  }

  subHeader(button: string): string {
    switch (button) {
      case 'task':
        return 'taskErrorLogs';
      case 'robot':
        return 'robotErrorLogs';
      case 'fleet':
        return 'fleetErrorLogs';
      default:
        return 'taskErrorLogs';
    }
  }

  setActiveButton(button: string) {
    this.activeButton = button;
    this.isTransitioning = true;
    
    this.searchInput = '';
    this.searchQuery = '';
    setTimeout(() => {
      this.activeButton = button;
      this.activeHeaderKey = this.getHeaderKey(button); // Store key instead of translated string
      this.activeHeader = this.getTranslation(this.activeHeaderKey);
      this.subHeaderKey = this.subHeader(button); // Store key instead of translated string
      this.activeSubHeader = this.getTranslation(this.subHeaderKey);
      this.isTransitioning = false;
    }, 200); // 300ms matches the CSS transition duration
  }

  setCurrentTable(table: string) {
    this.currentTable = table;
  }

  ShowExpBtn(): boolean {
    switch (this.currentTable) {
      case 'task':
        return this.errData.length == 0;
      default:
        return false;
    }
  }

  exportData(format: string) {
    const data = this.errData;
    // let csvHeader:any={};
    let excelHeader: any = {};
    switch (format) {
      case 'csv':
        let csvHeader: { [k: string]: any } = {};
        if (data.length == 0) {
          csvHeader['status'] = true;
          csvHeader['structure'] = this.structuredFormatter(
            this.currentTable
          )[0];
        }
        csvHeader['length'] = this.structuredFormatter(this.currentTable)[1];
        this.exportService.exportToCSV(
          data,
          `${this.currentTable}DataExport`,
          csvHeader
        );
        break;
      case 'excel':
        let excelHeader: { [k: string]: any } = {};
        if (data.length == 0) {
          (excelHeader['status'] = true),
            (excelHeader['structure'] = this.structuredFormatter(
              this.currentTable
            )[0]);
        }
        excelHeader['length'] = this.structuredFormatter(this.currentTable)[1];
        this.exportService.exportToExcel( data, `${this.currentTable}DataExport`, excelHeader );
        break;
      case 'pdf':
        this.exportService.exportToPDF(data, `${this.currentTable}DataExport`);
        break;
      default:
        console.error('Invalid export format');
    }
  }

  structuredFormatter(type: any): any {
    switch (type) {
      case 'task':
        return [
          [
            {
              dateTime: '',
              taskId: '',
              taskName: '',
              errCode: '',
              criticality: '',
              desc: '',
            },
          ],
          6,
        ];
      case 'robot':
        return [
          [
            {
              dateTime: '',
              robotId: '',
              robotName: '',
              errCode: '',
              criticality: '',
              desc: '',
            },
          ],
          6,
        ];
      case 'fleet':
        return [
          [
            {
              dateTime: '',
              moduleName: '',
              errCode: '',
              criticality: '',
              desc: '',
            },
          ],
          5,
        ];
      default:
        return {};
    }
  }

  getHeader(button: string): string {
    switch (button) {
      case 'task':
        return this.getTranslation('Task Logs');
      case 'robot':
        return this.getTranslation('Robot Logs');
      case 'fleet':
        return this.getTranslation('Fleet Logs');
      default:
        return this.getTranslation('Task Logs');
    }
  }

  showPopup() {
    this.isPopupVisible = true;
  }

  onClose() {
    this.isPopupVisible = false;
  }

  setActiveFilter(filter: string) {
    this.activeFilter = filter;
  }

  onDateFilterChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const filter = selectElement.value;
  }

  onDateChange(event: Event): void {
    const startDateElement = document.getElementById(
      'start-date'
    ) as HTMLInputElement;
    const endDateElement = document.getElementById(
      'end-date'
    ) as HTMLInputElement;

    const startDate = startDateElement.value;
    const endDate = endDateElement.value;
    console.log(startDate, endDate);

    // Implement your date range filtering logic here
  }
}
