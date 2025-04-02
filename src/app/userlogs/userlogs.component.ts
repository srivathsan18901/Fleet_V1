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
  filteredTaskData: any[] = [];
  filteredTaskData1: any[] = [];
  filteredTaskData2: any[] = [];
  paginatedData: any[] = [];
  paginatedData1: any[] = [];
  paginatedData2: any[] = [];
  initialRoboInfos: any[] = []; // to store data of initial robo details..
  mapDetails: any | null = null;

  taskData: any[] = [];
  filteredRobots: any[] = []; // To store filtered robots
  roboerrors: any[] = [];
  roboErr: any[] = [];

  // Your robot data
  robotData: any[] = [];

  // Your fleet data
  fleetData: any[] = [];
  isFleet: boolean = false; // Store the emitted value
  // private subscriptions: Subscription[] = [];

  robots: any[] = [];
  liveRobos: any[] = [];

  robotLogInterval: ReturnType<typeof setInterval> | null = null;
  taskLogInterval: ReturnType<typeof setInterval> | null = null;
  fleetLogInterval: ReturnType<typeof setInterval> | null = null;
  // private langSubscription!: Subscription;

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
  subHeaderKey : string = 'taskErrorLogs'
  activeSubHeader: any= this.getTranslation(this.subHeaderKey);

  async ngOnInit() {
    this.mapData = this.projectService.getMapData();
    if (!this.mapData) {
      console.log('Seems no map has been selected');
      return;
    }

    this.modeService.currentMode$.subscribe((mode) => {
      this.currentMode = mode; // React to mode updates
      // console.log(this.currentMode,"dkjnonvofpsp")
    });

    const savedIsFleet = sessionStorage.getItem('isFleet');
    if (savedIsFleet !== null) {
      this.isFleet = savedIsFleet === 'true'; // Convert string to boolean
      this.isFleetService.setIsFleet(this.isFleet); // Sync the state with the service
    }

    this.onModeChange(this.currentMode);
    await this.fetchRobos();

    this.showTable('task');
  }

  getTranslation(key: string) {
    return this.translationService.getErrorTranslation(key);
  }

  async ngAfterViewInit() {
    this.setPaginatedData();
  }

  showTable(table: string) {
    this.clearAllInterval();

    this.currentTable = table;
    if (this.currentTable == 'task') this.fetchTaskErr();
    else if (this.currentTable == 'robot') this.fetchRoboErr();
    else if (this.currentTable == 'fleet') this.fetchFleetErr();
  }

  async fetchTaskErr() {
    await this.getTaskLogs();
    this.setPaginatedData();
    this.taskLogInterval = setInterval(async () => {
      await this.getTaskLogs();
      this.setPaginatedData();
    }, 1000 * 3);
  }

  async fetchRoboErr() {
    // data rendering
    await this.getRoboLogs();
    this.robotLogInterval = setInterval(async () => {
      await this.getRoboLogs();
    }, 1000 * 3);
  }

  async fetchFleetErr() {
    this.getFleetLogs();
    this.fleetLogInterval = setInterval(async () => {
      await this.getFleetLogs();
    }, 1000 * 3);
  }

  async getTaskLogs() {
    this.mapData = this.projectService.getMapData();
    let establishedTime = new Date(this.mapData.createdAt);
    let { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay(establishedTime);
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/err-logs/task-logs/${this.mapData.id}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          timeStamp1: timeStamp1,
          timeStamp2: timeStamp2,
        }),
      }
    );
    let data = await response.json();
    // const { taskErr } = data;
    this.taskData = data?.taskErr
      ?.map((taskErr: any) => {
        if (taskErr === null) return null;

        let dateCreated = new Date(taskErr.TaskAddTime * 1000);
        const formattedDateTime = `${dateCreated.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}, ${dateCreated.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })}`;
        return {
          dateTime: formattedDateTime,
          taskId: taskErr.task_id,
          taskName: taskErr.task_id,
          errCode: 'Err001',
          criticality: taskErr.Error_code,
          desc: 'Robot is in Error State',
        };
      })
      .filter((Err: any) => Err !== null);

    this.filteredTaskData =
      this.taskData && this.taskData.length ? this.taskData : [];
  }

  async fetchRobos() {
    fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${this.mapData.mapName}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    )
      .then((response) => response.json())
      .then((data) => {
        if (!data.map || data.error) {
          return;
        }
        const { map } = data;

        // Check if the image URL is accessible
        this.robots = map.roboPos;
      });
  }

  async getLiveRoboInfo(): Promise<any[]> {
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/stream-data/get-live-robos/${this.mapData.id}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const data = await response.json();
    if (!data.map || data.error) return [];
    return data.robos;
  }

  updateLiveRoboInfo() {
    if (!('robots' in this.liveRobos)) {
      this.robots = this.initialRoboInfos;
      return;
    }

    let { robots }: any = this.liveRobos;
    if (!robots.length) this.robots = this.initialRoboInfos;
    this.robots = this.robots.map((robo) => {
      robots.forEach((liveRobo: any) => {
        if (robo.roboDet.id == liveRobo.id) {
          robo.errors = liveRobo.robot_errors;
        }
      });
      return robo;
    });
    this.filteredRobots = this.robots;
    this.roboerrors = this.robots.map((robo) => {
      return {
        name: robo.roboDet.roboName,
        error: robo.errors,
        id: robo.roboDet.id,
      };
    });
  }

  async getRoboLogs() {
    this.liveRobos = await this.getLiveRoboInfo();
    this.updateLiveRoboInfo();
    this.roboErr = [];

    this.roboerrors.forEach((robo) => {
      if (!robo || !robo.error) return;
      let date = new Date();
      let createdAt = date.toLocaleString('en-IN', {
        month: 'short',
        year: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      });

      if (robo.error['EMERGENCY STOP']?.length) {
        robo.error['EMERGENCY STOP'].forEach((error: any) => {
          this.roboErr.push({
            name: robo.name,
            error: error.name,
            description: error.description,
            id: robo.id,
            dateTime: createdAt,
          });
        });
      }
      if (robo.error['MANUAL MODE']?.length) {
        robo.error['MANUAL MODE'].forEach((error: any) => {
          this.roboErr.push({
            name: robo.name,
            error: error.name,
            description: error.description,
            id: robo.id,
            dateTime: createdAt,
          });
        });
      }
      if (robo.error['LIDAR_ERROR']?.length) {
        robo.error['LIDAR_ERROR'].forEach((error: any) => {
          this.roboErr.push({
            name: robo.name,
            error: error.name,
            description: error.description,
            id: robo.id,
            dateTime: createdAt,
          });
        });
      }
      if (robo.error['WAIT FOR ACK']?.length) {
        robo.error['WAIT FOR ACK'].forEach((error: any) => {
          this.roboErr.push({
            name: robo.name,
            error: error.name,
            description: error.description,
            id: robo.id,
            dateTime: createdAt,
          });
        });
      }
      if (robo.error['Dock Failed']?.length) {
        robo.error['Dock Failed'].forEach((error: any) => {
          this.roboErr.push({
            name: robo.name,
            error: error.name,
            description: error.description,
            id: robo.id,
            dateTime: createdAt,
          });
        });
      }
      if (robo.error['LOCALIZATION_ERROR']?.length) {
        robo.error['LOCALIZATION_ERROR'].forEach((error: any) => {
          this.roboErr.push({
            name: robo.name,
            error: error.name,
            description: error.description,
            id: robo.id,
            dateTime: createdAt,
          });
        });
      }
      if (robo.error['Docking Complete']?.length) {
        robo.error['Docking Complete'].forEach((error: any) => {
          this.roboErr.push({
            name: robo.name,
            error: error.name,
            description: error.description,
            id: robo.id,
            dateTime: createdAt,
          });
        });
      }
    });
    // console.log(this.roboErr);
    this.paginatedData1 = this.roboErr;
  }

  getFleetLogs() {
    fetch(
      `http://${environment.API_URL}:${environment.PORT}/err-logs/fleet-logs/${this.mapData.id}`,
      {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          timeStamp1: '',
          timeStamp2: '',
        }),
      }
    )
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        const { fleetLogs } = data;
        this.fleetData = fleetLogs.map((fleetErr: any) => {
          const date = new Date();
          const formattedDateTime = `${date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}, ${date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })}`;
          return {
            dateTime: formattedDateTime,
            moduleName: fleetErr.moduleName,
            errCode: fleetErr.errCode,
            criticality: fleetErr.criticality,
            desc: fleetErr.desc,
          };
        });
        this.filteredTaskData2 = this.fleetData;
        this.setPaginatedData();
      })
      .catch((error) => {
        console.log(error);
      });
  }

  setPaginatedData() {
    if (this.paginator) {
      const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
      this.paginatedData = this.filteredTaskData.slice(
        startIndex,
        startIndex + this.paginator.pageSize
      );
      this.paginatedData1 = this.filteredTaskData1.slice(
        startIndex,
        startIndex + this.paginator.pageSize
      );
      this.paginatedData2 = this.filteredTaskData2.slice(
        startIndex,
        startIndex + this.paginator.pageSize
      );
    }
  }

  onSearch(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchInput = inputValue; // Store the search input value

    if (!inputValue) {
      this.resetSearch(); // Reset data if input is cleared
    } else {
      // Filter the taskData, robotData, and fleetData based on the search input
      this.filteredTaskData = this.taskData.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(inputValue)
        )
      );
      this.filteredTaskData1 = this.robotData.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(inputValue)
        )
      );
      this.filteredTaskData2 = this.fleetData.filter((item) =>
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

  // Function to reset the search input and data
  resetSearch(): void {
    this.filteredTaskData = this.taskData;
    this.filteredTaskData1 = this.robotData;
    this.filteredTaskData2 = this.fleetData;
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
    const index = this.taskData.indexOf(item);
    if (index > -1) {
      this.taskData.splice(index, 1); // Remove the task from the tasks array
    }

    // Update the filteredTaskData and reapply pagination
    this.filteredTaskData = [...this.taskData]; // Ensure it's updated
    this.setPaginatedData(); // Recalculate the displayed paginated data
  }

  togglePopup() {
    throw new Error('Method not implemented.');
  }

  onModeChange(newMode: string) {
    this.currentMode = newMode; // Update mode on event
    console.log('Mode changed to:', newMode);
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

  ShowExpBtn():boolean {
    switch (this.currentTable) {
      case 'task':
        return this.taskData.length == 0;
      case 'robot':
        return this.robotData.length == 0;
      case 'fleet':
        return this.fleetData.length == 0;
      default:
        return false;
    }
  }

  getCurrentTableData() {
    switch (this.currentTable) {
      case 'task':
        return this.taskData;
      case 'robot':
        return this.robotData;
      case 'fleet':
        return this.fleetData;
      default:
        return [];
    }
  }

  exportData(format: string) {
    const data = this.getCurrentTableData();
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
        this.exportService.exportToExcel(
          data,
          `${this.currentTable}DataExport`,
          excelHeader
        );
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

  // onSearch(event: Event): void {
  //   const inputElement = event.target as HTMLInputElement;
  //   const query = inputElement.value;
  //   // Implement your search logic here
  // }

  onDateFilterChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const filter = selectElement.value;
    // Implement your date filter logic here
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

  clearAllInterval() {
    if (this.robotLogInterval) clearInterval(this.robotLogInterval);
    if (this.taskLogInterval) clearInterval(this.taskLogInterval);
    if (this.fleetLogInterval) clearInterval(this.fleetLogInterval);
  }

  ngOnDestroy() {
    // if (this.robotLogInterval) clearInterval(this.robotLogInterval);
    // if (this.taskLogInterval) clearInterval(this.taskLogInterval);
    // if (this.fleetLogInterval) clearInterval(this.fleetLogInterval);
    this.clearAllInterval();
  }
}
