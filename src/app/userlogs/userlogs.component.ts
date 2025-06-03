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
applyFilters(closePopup: boolean = true) {
  this.filterApplied = true;

  this.filteredErrLogsData = this.errData.filter(item => {
    if (this.filterOptions.startDateTime || this.filterOptions.endDateTime) {
      const itemDate = new Date(item.Date_and_Time);
      const startDate = this.filterOptions.startDateTime ? new Date(this.filterOptions.startDateTime) : null;
      const endDate = this.filterOptions.endDateTime ? new Date(this.filterOptions.endDateTime) : null;
      
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
    }

    if (this.filterOptions.status && item.criticality !== this.filterOptions.status) {
      return false;
    }

    if (this.filterOptions.errorCode && item.Error_Code !== this.filterOptions.errorCode) {
      return false;
    }

    if (this.filterOptions.id && item.id !== this.filterOptions.id) {
      return false;
    }

    return true;
  });

  if (this.paginator) {
    this.paginator.firstPage();
  }

  this.setPaginatedData();

  if (closePopup) {
    this.closeFilterPopup();
  }
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
clearFilters() {
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
    this.applyFilters();
    this.fetchErrorLogs();
  }

  taskErrorController: AbortController | null = null;
  robotErrorController: AbortController | null = null;

async fetchErrorLogs() {
  await this.getTaskLogs();
  
  // Only apply filters if user had previously applied any
  if (this.filterApplied) {
    this.applyFilters(false); // Don't close popup
  } else {
    this.filteredErrLogsData = [...this.errData];
    this.setPaginatedData();
  }

  setTimeout(() => this.fetchErrorLogs(), 1000 * 4);
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

  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchInput = this.searchQuery; // Store the search input value

    if (!this.searchQuery) {
      this.resetSearch(); // Reset data if input is cleared
    } else {
      // Filter the taskData, robotData, and fleetData based on the search input
      this.filteredErrLogsData = this.errData.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(this.searchQuery)
        )
      );
    }

    if (this.paginator) this.paginator.firstPage();

    this.setPaginatedData(); // Update paginated data after filtering
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
