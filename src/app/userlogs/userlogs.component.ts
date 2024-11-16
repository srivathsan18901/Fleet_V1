import { environment } from '../../environments/environment.development';
import { ExportService } from '../export.service';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ProjectService } from '../services/project.service';
import { timeStamp } from 'console';
// import { PageEvent } from '@angular/material/paginator';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

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
  searchQuery: string = '';
  searchInput: string = ''; // Add this property to your component class
  isPopupVisible: boolean | undefined;
  isTransitioning: boolean = false;
  activeButton: string = 'task'; // Default active button
  activeHeader: string = 'Task logs'; // Default header
  currentTable = 'task';
  currentTab: any;
  filteredTaskData: any[] = [];
  filteredTaskData1: any[] = [];
  filteredTaskData2: any[] = [];
  paginatedData: any[] = [];
  paginatedData1: any[] = [];
  paginatedData2: any[] = [];

  // Your task data
  taskData: any[] = [];

  // Your robot data
  robotData: any[] = [];

  // Your fleet data
  fleetData: any[] = [];

  constructor(
    private exportService: ExportService,
    private projectService: ProjectService
  ) {
    this.mapData = this.projectService.getMapData();
  }

  ngOnInit() {
    this.mapData = this.projectService.getMapData();
    if (!this.mapData) {
      console.log('Seems no map has been selected');
      return;
    }
    // data rendering
    this.getTaskLogs();
    this.getRoboLogs();
    this.getFleetLogs();
  }

  getTaskLogs() {
    fetch(
      `http://${environment.API_URL}:${environment.PORT}/err-logs/task-logs/${this.mapData.id}`,
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
        // if (!response.ok)
        //   throw new Error(`Error with the statusCode of ${response.status}`);
        return response.json();
      })
      .then((data) => {
        const { taskLogs } = data;
        this.taskData = taskLogs.notifications.map((taskErr: any) => {
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
            taskId: taskErr.taskId,
            taskName: 'Pick Packs',
            errCode: taskErr.name,
            criticality: taskErr.criticality,
            desc: taskErr.description,
          };
        });
        this.filteredTaskData = this.taskData;
        this.setPaginatedData();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  getRoboLogs() {
    fetch(
      `http://${environment.API_URL}:${environment.PORT}/err-logs/robo-logs/${this.mapData.id}`,
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
        // if (!response.ok)
        //   throw new Error(`Error with the statusCode of ${response.status}`);
        return response.json();
      })
      .then((data) => {
        const { roboLogs } = data;
        this.robotData = roboLogs.table[0].values.map((roboErr: any) => {
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
            roboId: roboErr.ROBOT_ID,
            roboName: roboErr.ROBOT_NAME,
            errCode: '100',
            criticality: Math.floor(Math.random() * 10),
            desc: roboErr.DESCRIPTION,
          };
        });
        this.filteredTaskData1 = this.robotData;
        this.setPaginatedData();
      })
      .catch((err) => {
        console.log(err);
      });
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
        // if (!response.ok)
        //   throw new Error(`Error with the statusCode of ${response.status}`);
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
      .catch((err) => {
        console.log(err);
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
    this.resetSearch();    // Reset the data
    this.setPaginatedData(); // Update paginated data
  }
  


  trackByTaskId(index: number, item: any): number {
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

  setActiveButton(button: string) {
    this.activeButton = button;
    this.isTransitioning = true;
    setTimeout(() => {
      this.activeButton = button;
      this.activeHeader = this.getHeader(button);
      this.isTransitioning = false;
    }, 200); // 300ms matches the CSS transition duration
  }

  showTable(table: string) {
    this.currentTable = table;
  }

  setCurrentTable(table: string) {
    this.currentTable = table;
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
    switch (format) {
      case 'csv':
        this.exportService.exportToCSV(data, `${this.currentTable}DataExport`);
        break;
      case 'excel':
        this.exportService.exportToExcel(
          data,
          `${this.currentTable}DataExport`
        );
        break;
      case 'pdf':
        this.exportService.exportToPDF(data, `${this.currentTable}DataExport`);
        break;
      default:
        console.error('Invalid export format');
    }
  }

  getHeader(button: string): string {
    switch (button) {
      case 'task':
        return 'Task logs';
      case 'robot':
        return 'Robot logs';
      case 'fleet':
        return 'Fleet logs';
      default:
        return 'Task logs';
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
}
