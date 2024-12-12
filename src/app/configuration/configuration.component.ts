import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  ViewEncapsulation,
  Input,
  viewChild,
} from '@angular/core';
import { ExportService } from '../export.service';
import { formatDate } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { RobotParametersPopupComponent } from '../robot-parameters-popup/robot-parameters-popup.component';
import { environment } from '../../environments/environment.development';
import { ProjectService } from '../services/project.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { EnvmapComponent } from '../envmap/envmap.component';
import { MessageService } from 'primeng/api';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { FormBuilder } from '@angular/forms';
import { v4 as uuid } from 'uuid';
import { CookieService } from 'ngx-cookie-service';
import { AuthService } from '../auth.service';
import { SessionService } from '../services/session.service';

interface Poll {
  ip: string;
  mac: string;
  host: string;
  ping: string;
  Status: string;
}
@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom, // Use shadow DOM to isolate styles
})
export class ConfigurationComponent implements AfterViewInit {
  @ViewChild(EnvmapComponent) envmapComponent!: EnvmapComponent;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('uploadedCanvas', { static: false })
  uploadedCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('overlayLayer', { static: false }) overlayLayer!: ElementRef;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  nodes: Array<{ x: number; y: number; id: number }> = [];
  selectedNode: { x: number; y: number; id: number } | null = null;
  nodeIdCounter: number = 0; // Counter to generate unique IDs for each node
  fleetTab: string = 'general';
  filteredData: any;
  originalData: any;
  searchQuery: string = '';
  isPopupVisible: boolean = false;
  isTransitioning: boolean = false;
  activeButton: string = 'Environment'; // Default active button
  activeHeader: string = 'Environment'; // Default header
  chosenImageName = ''; // Initialize chosenImageName with an empty string
  imageUploaded: boolean = false; // To track if an image is uploaded
  imageFile: File | null = null; // Store the uploaded image file
  isImageOpened: boolean = false; // Track if the image is opened in the canvas
  currentTable = 'Environment';
  currentTab: any;
  imageHeight: number = 0; // Height in meters
  imageWidth: number = 0; // Width in meters
  pixelsPerMeter: number = 0; // Pixels per meter
  private backgroundImage: HTMLImageElement | null = null;
  isConnectivityModeActive: boolean = false; // Track if connectivity mode is active
  connectivityPoints: { x: number; y: number }[] = []; // Store selected points for connectivity
  selectedMap: any = null;
  mapData: any = null;
  isSimulating: boolean = false;
  isPagination: boolean = false;
  searchTerm: string = '';
  filteredEnvData: any[] = [];
  filteredipData: any[] = [];
  filteredRobotData: any[] = [];
  tableLoader:any;
  cookieValue: any;
  userManagementData:any;
  username: string | null = null;
  userrole                                                : string | null = null;


  // formData: any;
  isPopupOpen: boolean = false;
  isScanning = false;
  EnvData: any[] = []; // map details..
  currentRoboDet: any | null = null;
  isRoboInEdit: boolean = false;
  currEditRobo: any | null = null;

  currEditMap: boolean = false;
  onMapEdit: boolean = false;
  currEditMapDet: any | null = null;
  agvKinematicsOptions: any[] = [
    { name: 'DIFF', value: 'DIFF' },
    { name: 'OMNI', value: 'OMNI' },
    { name: 'THREEWHEEL', value: 'THREEWHEEL' },
  ];
  agvClassOptions: any[] = [
    { name: 'NOT_SET', value: 'NOT_SET' },
    { name: 'FORKLIFT', value: 'FORKLIFT' },
    { name: 'CONVEYOR', value: 'CONVEYOR' },
    { name: 'TUGGER', value: 'TUGGER' },
    { name: 'CARRIER', value: 'CARRIER' },
  ];
  localizationTypes: any[] = [
    { name: 'NATURAL', value: 'NATURAL' },
    { name: 'REFLECTOR', value: 'REFLECTOR' },
    { name: 'RFID', value: 'RFID' },
    { name: 'DMC', value: 'DMC' },
    { name: 'SPOT', value: 'SPOT' },
    { name: 'GRID', value: 'GRID' },
  ];
  navigationTypes: any[] = [
    { name: 'PHYSICAL_LINE_GUIDED', value: 'PHYSICAL_LINE_GUIDED' },
    { name: 'VIRTUAL_LINE_GUIDED', value: 'VIRTUAL_LINE_GUIDED' },
    { name: 'AUTONOMOUS', value: 'AUTONOMOUS' },
  ];

  robotData: any[] = [];
  paginatedData: any[] = [];
  paginatedData1: any[] = [];
  paginatedData2: any[] = [];
  simRobos: any;

  // loader
  editLoader:boolean=false;
  configurationPermissions: any;
  environmentPermissions: { read: any; view: any; edit: any; } | undefined;

  constructor(
    private cdRef: ChangeDetectorRef,
    private projectService: ProjectService,
    public dialog: MatDialog, // Inject MatDialog
    private messageService: MessageService,
    private sessionService: SessionService,
    private authService: AuthService,
    private cookieService: CookieService,
  ) {
    this.filteredEnvData = [...this.EnvData];
    // this.filteredRobotData = [...this.robotData];
    // this.filteredRobotData = this.robotData;
  }

  async ngOnInit() {
    console.log('ngon init triggered');
    this.userManagementData=JSON.parse(this.projectService.userManagementSericeGet());
    console.log(this.userManagementData.permissions.configurationPermissions,'--configuration permissions')

    if(this.userManagementData?.permissions?.configuraionPermissions){
      this.configurationPermissions = this.userManagementData.permissions.configurationPermissions;
      console.log('Config Permissions --', this.userManagementData.configuraionPermissions)
    }else {
      console.error('Configuration permissions not found in response');
      this.configurationPermissions = null; // Fallback for safety
    }

    if (this.userManagementData?.permissions?.configurationPermissions) {
      this.configurationPermissions = this.userManagementData.permissions.configurationPermissions;
    
      // Extract specific states for "Environment"
      this.environmentPermissions = {
        read: this.configurationPermissions.environment.read ?? false,
        view: this.configurationPermissions.environment.view ?? false,
        edit: this.configurationPermissions.environment.edit ?? false,
      };
    
      console.log('Environment Permissions:', this.environmentPermissions);
    } else {
      console.error('Configuration permissions not found in response');
      this.configurationPermissions = null; // Fallback for safety
      this.environmentPermissions = { read: false, view: false, edit: false }; // Default permissions

    }

    // this.initializeDefaultButton()


    

    

    




    const user = this.authService.getUser();
    if (user) {
      this.username = user.name;
      this.userrole = user.role;
    }
    this.cookieValue = JSON.parse(this.cookieService.get('_user'));
    this.selectedMap = this.projectService.getMapData();
    try {
      this.loadData();
      this.setPaginatedData();
      this.setPaginatedData1();
      // this.selectFirstMapIfNoneSelected();
      this.filteredEnvData = [...this.EnvData];
      this.filteredRobotData = [...this.robotData];
      this.cdRef.detectChanges();
      const today = new Date();
      const pastFiveYears = new Date();
      pastFiveYears.setFullYear(today.getFullYear() - 5);

      this.minDate = this.formatDate(pastFiveYears);
      this.maxDate = this.formatDate(today);

      if (this.projectService.getInitializeMapSelected() == 'true') {
        let currMapData = this.projectService.getMapData();
        if (currMapData) {
          // console.log('line 154');
          this.selectedMap = currMapData;
          this.setPaginatedData();
        }
      }

      this.mapData = this.projectService.getSelectedProject(); // _id
      if (!this.mapData) return;
      this.tableLoader=true;
      let response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/fleet-project/${this.mapData._id}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error(`Error code of ${response.status}`);
      let data = await response.json();
      this.tableLoader=false
      const { sites } = data.project;
      this.EnvData = sites
        .flatMap((sites: any) => {
          return sites.maps.map((map: any) => {
            let date = new Date(map?.createdAt);
            let createdAt = date.toLocaleString('en-IN', {
              month: 'short',
              year: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
            });

            return {
              id: map.mapId,
              mapName: map.mapName,
              siteName: sites.siteName,
              date: createdAt,
              createdAt: map.createdAt, // for sorting..
            };
          });
        })
        .filter((item: any) => item !== null); // just to filter out the null from the EnvData array!..

      this.EnvData.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      this.filteredEnvData = [...this.EnvData];
      this.setPaginatedData();
      this.cdRef.detectChanges();
      // console.log(this.projectService.getIsMapSet(), this.projectService.getMapData(), this.EnvData[0]);
      // if (!this.projectService.getIsMapSet()) {
      //   console.log(this.projectService.getIsMapSet(), 'map set');
      //   console.log('line 201');
      //   this.selectedMap = this.EnvData[0];
      //   let imgUrl = '';
      //   if (this.EnvData[0]) {
      //     imgUrl = await this.getMapImgUrl(this.selectedMap);
      //     this.projectService.setMapData({
      //       ...this.EnvData[0],
      //       imgUrl: imgUrl,
      //     });
      //     this.projectService.setIsMapSet(true);
      //   }
      // }
      if (this.sessionService.isMapInEdit()) {
        this.onMapEdit = true;
        this.showImageUploadPopup = true;
      }
      // })
    } catch (error) {
      console.log(error);
    }

    this.fetchRobos(); // fetch all robots..

    if (!this.EnvData.length) return;

    this.searchTerm = '';
    this.searchTermChanged();
  }

  // initializeDefaultButton() {
  //   const permissions = this.userManagementData?.permissions?.configurationPermissions;

  //   if (permissions?.robot?.enabled) {
  //     this.setActiveButton('robot', 'Robot')
  //   } else if (permissions?.environment?.enabled) {
  //     this.setActiveButton('environment', 'Environment')
  //   } else if (permissions?.fleet?.enabled) {
  //     this.setActiveButton('fleet', 'Fleet')
  //   }
  // }



  reloadTable() {
    this.loadData(); // Ensure data is reloaded properly
    this.setPaginatedData(); // Ensure the paginated data is set correctly after loading
    this.filterData(); // Optional if you are applying filters
    // this.resetFilters();
  }

  onChanges() {
    this.loadData();
    this.reloadTable();
    this.filterData();
    // this.setPaginatedData();
    console.log('data added');
  }

  onPopupSave() {
    this.resetFilters();
  }

  // Simulation
  async startSimulation() {
    if (!this.selectedMap) return;
    try {
      this.selectedRobots = this.paginatedData1.filter(
        (item) => item.isSimMode
      );

      if (!this.selectedRobots.length) {
        alert('no robos to sim');
        return;
      }

      // customize your filter here..
      let simRobots = this.selectedRobots.map((robo) => {
        return {
          ipAdd: robo.ipAdd,
          amrId: robo.amrId,
          uuid: robo.uuid,
          roboName: robo.roboName,
        };
      });
      await this.updateSimInMap(simRobots);

      this.paginatedData1.forEach(async (robo: any) => {
        let isSim = simRobots.some(
          (simRobo: any) => simRobo.roboName === robo.roboName
        );
        await this.updateSimInRobo(robo.roboName, isSim);
      });

      this.isSimulating = true;
      alert('Robos in sim mode!');
    } catch (error) {
      console.log('Error while simulating : ', error);
    }
  }

  async updateSimInMap(simRobots: any): Promise<boolean> {
    let editedMap = {
      simMode: simRobots,
    };
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/update-map/${this.selectedMap.mapName}`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedMap),
      }
    );
    let data = await response.json();
    if (data.updatedData) return true;
    return false;
  }

  async updateSimInRobo(roboName: any, isSim: boolean) {
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/robo-configuration/${roboName}`,
      {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roboName: null,
          isSimMode: isSim, // here it is..
        }),
      }
    );

    let data = await response.json();
    // console.log(data);
  }

  async fetchRobos() {
    let mapData = this.projectService.getMapData();
    // this.filteredRobotData = this.mapData;
    if (!mapData) return;
    try {
      let response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/robo-configuration/get-robos/${mapData.id}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );
      if (response.status == 422) {
        console.log('Invalid map id, which request to fetch robots');
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Invalid map id, which request to fetch robots',
          life: 4000,
        });
        return;
      }
      let data = await response.json();

      // console.log(data);
      // this.filteredRobotData = data.populatedRobos;
      // this.messageService.add({
      //   severity: 'success',
      //   summary: 'Success',
      //   detail: 'Robots Fetched Successfully',
      //   life: 4000,
      // });

      if (data.error) return;
      if (data.populatedRobos) this.robotData = data.populatedRobos;
      this.filteredRobotData = this.robotData;
      this.setPaginatedData1();
      this.reloadTable();
      // console.log(this.filteredRobotData)
      // this.filteredRobotData = data.populatedRobos;
    } catch (error) {
      console.log(error);
    }
  }

  // edit robo..
  editRobo(robo: any) {
    // console.log(robo);
    // Reset all form section visibility flags
    this.isTypeSpecificationFormVisible = false;
    this.isProtocolLimitsFormVisible = false;
    this.isProtocolFeaturesFormVisible = false;
    this.isAGVGeometryFormVisible = false;
    this.isLoadSpecificationFormVisible = false;
    this.isLocalizationParametersFormVisible = false;
    this.formData = robo.grossInfo;
    this.isPopupOpen = !this.isPopupOpen;

    // Track if we're in edit mode
    // this.isRoboInEdit = !this.isRoboInEdit;
    this.isRoboInEdit = true;

    // Store the currently edited robot for reference
    this.currEditRobo = robo;
    // this.newItem = { ...item }; // Initialize with the clicked item's data
    this.cdRef.detectChanges();
  }

  async updateRobo() {
    if (!this.currEditRobo.roboName) {
      alert('seems robo not selected');
      return;
    }
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/robo-configuration/${this.currEditRobo.roboName}`,
      {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roboName:
            this.formData.robotName === this.currEditRobo.roboName
              ? null
              : this.formData.robotName,
          grossInfo: this.formData,
        }),
      }
    );

    let data = await response.json();
    console.log(data);
    if (data.roboExists === true) {
      alert('robo with this name already exists!');
      // return;
    } else if (data.updatedData) {
      // alert('robo updated');
      this.messageService.add({
        severity: 'success',
        summary: 'Updated',
        detail: 'Robo Details Udated Successfully',
        life: 4000,
      });
      // return;
    }
    this.setPaginatedData1();
    this.closeroboPopup();
    // console.log('line 425');
    this.ngOnInit();
  }

  // deleteRobo(robo: any) {
  //   let project = this.projectService.getSelectedProject();
  //   let map = this.projectService.getMapData();
  //   let roboInfo = {
  //     roboId: robo._id,
  //     projectName: project.projectName,
  //     mapName: map.mapName,
  //   };

  //   fetch(
  //     `http://${environment.API_URL}:${environment.PORT}/robo-configuration`,
  //     {
  //       method: 'DELETE',
  //       credentials: 'include',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(roboInfo),
  //     }
  //   )
  //     .then((response) => response.json())
  //     .then((data) => {
  //       if (data.isRoboExists) {
  //         this.messageService.add({
  //           severity: 'success',
  //           summary: 'Success',
  //           detail: 'Robot deleted successfully!',
  //         });
  //         this.fetchRobos();
  //         this.setPaginatedData1();
  //         this.cdRef.detectChanges();
  //         this.ngOnInit();
  //       } else {
  //         this.messageService.add({
  //           severity: 'error',
  //           summary: 'Error',
  //           detail: 'Failed to delete the robot.',
  //         });
  //       }
  //     })
  //     .catch((error) => {
  //       console.error(error);
  //       this.messageService.add({
  //         severity: 'error',
  //         summary: 'Error',
  //         detail: 'An error occurred while deleting the robot.',
  //       });
  //     });
  // }
  deleteRobo(robo: any) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent); // Open confirmation dialog

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // If the user confirmed deletion
        let project = this.projectService.getSelectedProject();
        let map = this.projectService.getMapData();
        let roboInfo = {
          roboId: robo._id,
          projectName: project.projectName,
          mapName: map.mapName,
        };

        // Perform the delete operation
        fetch(
          `http://${environment.API_URL}:${environment.PORT}/robo-configuration`,
          {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roboInfo),
          }
        )
          .then((response) => response.json())
          .then((data) => {
            if (data.isRoboExists) {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Robot deleted successfully!',
                life: 4000,
              });
              this.fetchRobos(); // Refresh the list of robots
              this.setPaginatedData1(); // Update the paginator data
              this.cdRef.detectChanges(); // Trigger change detection
              // console.log('line 510');
              this.ngOnInit(); // Re-initialize the component if needed
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to delete the robot.',
                life: 4000,
              });
            }
          })
          .catch((error) => {
            console.error(error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'An error occurred while deleting the robot.',
              life: 4000,
            });
          });
      }
    });
  }

  trackByTaskId(index: number, item: any): number {
    return item.taskId; // or any unique identifier like taskId
  }

  trackByTaskName(index: number, item: any): number {
    return item._id;
  }

  validateIP(ip: string): boolean {
    const ipPattern = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/;
    return ipPattern.test(ip);
  }

  setPaginatedData() {
    console.log('paginated data called');
    if (this.currentTable === 'Environment') {
      const pageSize = this.paginator?.pageSize || 5; // Default pageSize to 5 if paginator is not yet available
      const pageIndex = this.paginator?.pageIndex || 0; // Default pageIndex to 0 (first page)

      // Paginate the data based on current page and page size
      const startIndex = pageIndex * pageSize;
      const endIndex = startIndex + pageSize;

      this.paginatedData = this.filteredEnvData.slice(startIndex, endIndex);
      // console.log(this.filteredRobotData);

      // Optionally, ensure that the paginator reflects the right page size and length
      if (this.paginator) {
        this.paginator.length = this.filteredEnvData.length;
        // console.log(this.filteredRobotData);
      }
    }
  }

  setPaginatedData1() {
    if (this.currentTable === 'robot') {
      const pageSize1 = this.paginator?.pageSize || 5; // Default pageSize to 5 if paginator is not yet available
      let pageIndex1 = this.paginator?.pageIndex || 0; // Default pageIndex to 0 (first page)

      // Ensure that we reset to the first page if the page becomes empty after deletion
      const totalItems = this.filteredRobotData.length;
      const totalPages = Math.ceil(totalItems / pageSize1);

      // If the current page index exceeds the total number of pages after deletion, reset to page 1
      if (pageIndex1 >= totalPages) {
        pageIndex1 = 0;
        this.paginator.pageIndex = pageIndex1;
      }

      // Paginate the data based on the current page and page size
      const startIndex = pageIndex1 * pageSize1;
      const endIndex = startIndex + pageSize1;

      // Update the paginated data with the sliced portion of the data array
      this.paginatedData1 = this.filteredRobotData.slice(startIndex, endIndex);

      // console.log(this.filteredRobotData);

      // Ensure the paginator reflects the correct page size and total data length
      if (this.paginator) {
        this.paginator.length = this.filteredRobotData.length;
        // console.log(this.filteredRobotData);
      }
    }
  }

  // Ensure pagination is triggered on page change
  onPageChange(event: PageEvent) {
    this.paginator.pageIndex = event.pageIndex;
    this.paginator.pageSize = event.pageSize;
    this.setPaginatedData(); // Update paginated data on page change
  }
  onPageChanges(event: PageEvent) {
    this.paginator.pageIndex = event.pageIndex;
    this.paginator.pageSize = event.pageSize;
    this.setPaginatedData1();
    this.fetchRobos();
  }

  //Commit Changed
  // Search method
  onSearch(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value.toLowerCase();

    if (!inputValue) {
      this.filteredEnvData = this.EnvData;
      this.filteredRobotData = this.robotData;
    } else {
      this.filteredEnvData = this.EnvData.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(inputValue)
        )
      );
      this.filteredRobotData = this.robotData.filter((item) =>
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

  async selectMap(map: any) {
    // console.log('select deselected clicked')
    // let mapStatus=this.projectService.getInitializeMapSelected()
    this.projectService.setInitializeMapSelected(true);
    // Deselect if the same map is clicked again
    if (this.selectedMap?.id === map.id) {
      this.projectService.clearMapData();
      this.projectService.setIsMapSet(false);
      if (!this.EnvData.length) return;
      this.selectedMap = this.EnvData[0];
      const response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${this.EnvData[0]?.mapName}`
      );
      if (!response.ok)
        console.error('Error while fetching map data : ', response.status);
      let data = await response.json();
      // let { map } = data;
      // console.log('line 656');
      await this.ngOnInit();

      // if (this.projectService.getIsMapSet()) return; // yet to uncomment..
      // this.projectService.setIsMapSet(true);
      return;
    }
    // Select a new map
    this.selectedMap = map;
    await this.loadMapData(map);

    // Store the selected map in localStorage or service
    if (this.selectedMap) {
      localStorage.setItem('selectedMapId', this.selectedMap.id);
      this.messageService.add({
        severity: 'success',
        summary: 'Map Selected',
        detail: `Successfully loaded map: ${map.mapName}`,
      });
    } else {
      localStorage.removeItem('selectedMapId');
    }
  }

  private async loadMapData(map: any) {
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${map?.mapName}`
    );
    if (!response.ok)
      console.error('Error while fetching map data : ', response.status);
    let data = await response.json();

    this.projectService.setMapData({
      ...map,
      imgUrl: data.map.imgUrl,
    });

    if (this.projectService.getIsMapSet()) return;
    this.projectService.setIsMapSet(true);
  }
  // This method can be called when the component is initialized or when a new map is created
  private selectFirstMapIfNoneSelected() {
    if (!this.selectedMap && this.EnvData.length > 0) {
      this.selectMap(this.EnvData[0]);
    }
  }
  //   async selectMap(map: any) {
  //     if (this.selectedMap?.id === map.id) {
  //         // Deselect if the same map is clicked again
  //         this.projectService.clearMapData();
  //         this.projectService.setIsMapSet(false);
  //         if (!this.EnvData.length) return;

  //         // Automatically select the first item after deselection
  //         this.selectedMap = this.EnvData[0];
  //         const response = await fetch(
  //           `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${this.EnvData[0]?.mapName}`
  //         );
  //         if (!response.ok)
  //             console.error('Error while fetching map data : ', response.status);

  //         let data = await response.json();
  //         this.projectService.setMapData({
  //             ...this.EnvData[0],
  //             imgUrl: data.map.imgUrl,
  //         });

  //         this.projectService.setIsMapSet(true);
  //         return;
  //     }

  //     // Select a new map
  //     this.selectedMap = map;
  //     if (!this.EnvData.length) return;
  //     this.projectService.clearMapData();
  //     const response = await fetch(
  //       `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${map?.mapName}`
  //     );
  //     if (!response.ok)
  //         console.error('Error while fetching map data : ', response.status);

  //     let data = await response.json();
  //     this.projectService.setMapData({
  //         ...map,
  //         imgUrl: data.map.imgUrl,
  //     });

  //     this.projectService.setIsMapSet(true);
  // }

  // // This method can be called when the component is initialized or when a new map is created
  // private selectFirstMapIfNoneSelected() {
  //     if (!this.selectedMap && this.EnvData.length > 0) {
  //         this.selectMap(this.EnvData[0]);
  //     }
  // }

  // // Call this method in ngOnInit to ensure the first map is selected when the component is initialized
  // // ngOnInit() {
  // //     this.selectFirstMapIfNoneSelected();
  // //     // Other initialization logic
  // // }

  async getMapImgUrl(map: any): Promise<any> {
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${map?.mapName}`
    );
    if (!response.ok)
      console.error('Error while fetching map data : ', response.status);
    let data = await response.json();
    if (!data.error) return data.map.imgUrl;
  }

  isButtonDisabled(item: any): boolean {
    return this.selectedMap?.id === item.id;
  }

  ngOnChanges() {
    this.filterData();
  }

  isTypeSpecificationFormVisible = false;
  isProtocolLimitsFormVisible = false;
  isProtocolFeaturesFormVisible = false;
  isAGVGeometryFormVisible = false;
  isLoadSpecificationFormVisible = false;
  isLocalizationParametersFormVisible = false;

  // toggleTypeSpecificationForm($event:any) {
  //   // this.resetFormVisibility();
  //   this.isTypeSpecificationFormVisible = !this.isTypeSpecificationFormVisible;
  // }

  // toggleProtocolLimitsForm($event:any) {
  //   // this.resetFormVisibility();
  //   this.isProtocolLimitsFormVisible = !this.isProtocolLimitsFormVisible;
  // }

  // toggleProtocolFeaturesForm($event:any) {
  //   // this.resetFormVisibility();
  //   this.isProtocolFeaturesFormVisible = !this.isProtocolFeaturesFormVisible;
  // }

  // toggleAGVGeometryForm($event:any) {
  //   // this.resetFormVisibility();
  //   this.isAGVGeometryFormVisible = !this.isAGVGeometryFormVisible;
  // }

  // toggleLoadSpecificationForm($event:any) {
  //   // this.resetFormVisibility();
  //   this.isLoadSpecificationFormVisible = !this.isLoadSpecificationFormVisible;
  // }

  // toggleLocalizationParametersForm($event:any) {
  //   // this.resetFormVisibility();
  //   this.isLocalizationParametersFormVisible = !this.isLocalizationParametersFormVisible;
  // }

  // // Resets all form visibility to false (hide all forms)
  // resetFormVisibility() {
  //   this.isTypeSpecificationFormVisible = false;
  //   this.isProtocolLimitsFormVisible = false;
  //   this.isProtocolFeaturesFormVisible = false;
  //   this.isAGVGeometryFormVisible = false;
  //   this.isLoadSpecificationFormVisible = false;
  //   this.isLocalizationParametersFormVisible = false;
  // }

  // Utility function to remove the time part of a date
  // normalizeDate(date: Date): Date {
  //   return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // }
  normalizeDate(date: Date): string {
    return this.formatDate(date); // Strips time information, returns 'YYYY-MM-DD'
  }

  selectedrobotData = [
    { column1: '192.168.XX.XX', column2: ' ' },
    { column1: '192.168.XX.XX', column2: ' ' },
  ];
  ipScanData: any[] = [];

  loadData() {
    // Fetch or initialize data here
    // this.EnvData = []; // Replace with actual data fetching
    this.setPaginatedData(); //changes made for Realoading the Data
    this.filterData(); // Initial filter application
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.setPaginatedData(); // Safe to access paginator here
      this.setPaginatedData1();
    }
  }

  drawConnectivity() {
    const canvas = this.uploadedCanvas?.nativeElement;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    const [start, end] = this.connectivityPoints;
    if (start && end) {
      // Draw a line between the two points
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);

      // Set line style
      ctx.strokeStyle = 'orange';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw arrow or other indication if needed
      // (optional, for visualization)
    }
  }
  isRobotPopupVisible: boolean = false;
  eventSource!: EventSource;
  startIP: string = '';
  EndIP: string = '';
  toggleSelectAll(event: any): void {
    const isChecked = event.target.checked;
    this.paginatedData1.forEach((item) => (item.selected = isChecked));
  }

  async startScanning() {
    this.ipScanData = [];
    if (this.validateIP(this.startIP) && this.validateIP(this.EndIP)) {
      console.log('IP range is valid');
    } else {
      console.log('Invalid IP addresses');
    }

    if (this.startIP === '' || this.EndIP === '') {
      this.setPaginatedData() 
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Enter valid IP',
      });
      return;
    }

    const ipv4Regex =
      /^(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipv4Regex.test(this.startIP) || !ipv4Regex.test(this.EndIP)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Not valid IP. Try again',
      });
      return;
    }

    const URL = `http://${environment.API_URL}:${environment.PORT}/fleet-config/scan-ip/${this.startIP}-${this.EndIP}`;

    const response = await fetch(URL, { method: 'GET' });

    if (response.status === 422) {
      // alert(`Ip range is too large`);
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Ip range is too large',
      });
      return;
    }

    if (this.eventSource) this.eventSource.close();

    this.eventSource = new EventSource(URL);
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        let poll: Poll = {
          ip: data.ip_address,
          mac:
            data.mac_address === '' || data.mac_address === 'undefined'
              ? '00:00:00:00:00:00'
              : data.mac_address,
          host: data.host,
          ping: data.time,
          // hostname:data.hostname,
          Status: data.status,
        };
        // console.log(poll);

        if (poll.Status === 'online')
          this.ipScanData = [...this.ipScanData, poll];
        // this.ipScanData = this.filteredipData;
        // this.setPaginatedData();
        this.cdRef.detectChanges();
      } catch (error) {
        console.error('Error parsing SSE data:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error parsing SSE data ${error}`,
        });
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.eventSource.close();
      this.messageService.add({
        severity: 'success',
        summary: 'Completed',
        detail: 'Scanning Completed',
      });
      this.isScanning = false;
      this.cdRef.detectChanges();
    };
    this.isScanning = true;
    if (this.isScanning)
      this.messageService.add({
        severity: 'info',
        summary: 'Info',
        detail: 'Started scanning',
      });
  }
  stopScanning() {
    this.isScanning = false;
    this.eventSource.close();
    this.messageService.add({
      severity: 'error',
      summary: 'Info',
      detail: 'Scanning Stopped',
    });
    return;
  }

  robots = [
    { id: 1, name: 'Robot A' },
    { id: 2, name: 'Robot B' },
  ];

  selectedRobots: any[] = [];
  showRobotPopup() {
    this.isRobotPopupVisible = true;
  }

  closeRobotPopup() {
    this.isRobotPopupVisible = false;
  }
  showRobotParametersPopup = false;
  openRobotParametersPopup() {
    this.showRobotParametersPopup = true;
  }
  closeRobotParametersPopup() {
    this.showRobotParametersPopup = false;
  }
  showImageUploadPopup = false;
  openImageUploadPopup(): void {
    this.currEditMap = false;
    // Reset the search filters
    this.startDate = null;
    this.endDate = null;
    this.searchTerm = ''; // If you have a search term, reset it as we
    this.showImageUploadPopup = true;
    this.setPaginatedData();
    this.filterData();
    this.resetFilters();
  }

  closeImageUploadPopup(): void {
    this.showImageUploadPopup = false;
  }
  updateMapDetails(event: { mapName: string; siteName: string }) {
    const { mapName, siteName } = event;
    if (mapName && siteName) {
      const newEntry = {
        mapName,
        siteName,
        lastCreated: new Date().toLocaleDateString(),
      };
      this.filteredEnvData.push(newEntry);
    }
  }

  showIPScannerPopup = false;

  openIPScanner() {
    this.showIPScannerPopup = true;
  }

  closeIPScanner() {
    this.showIPScannerPopup = false;
  }

  connectivity() {
    this.isConnectivityModeActive = true; // Enable connectivity mode
    this.connectivityPoints = []; // Clear previous points
    console.log('Connectivity mode activated. Select two points.');
  }

  connectivityMode: 'none' | 'bi-directional' | 'uni-directional' = 'none';
  firstPoint: { x: number; y: number } | null = null;
  secondPoint: { x: number; y: number } | null = null;

  addEnvironmentData() {
    const newEntry = {
      // mapName: this.mapName,
      // siteName: this.siteName,
      date: formatDate(new Date(), 'MMM d, yyyy. HH:mm:ss', 'en-US'),
    };

    this.EnvData.push(newEntry);
    this.filteredEnvData = [...this.EnvData];
    this.setPaginatedData();
  }

  isCalibrationLayerVisible = false;

  showCalibrationLayer() {
    this.isCalibrationLayerVisible = true;
  }

  hideCalibrationLayer() {
    this.isCalibrationLayerVisible = false;
  }

  addNode() {
    console.log('Add Node clicked');
  }

  zones() {
    console.log('Zones clicked');
  }

  addAssets() {
    console.log('Add Assets clicked');
  }

  addRobots() {
    console.log('Add Robots clicked');
  }

  removeRobots() {
    console.log('Remove Robots clicked');
  }

  setActiveButton(button: string) {
    this.activeButton = button;
    // this.currentTable = button;
    // this.activeHeader = header;
    this.isTransitioning = true;
    this.filterData();
    this.setPaginatedData();
    this.activeButton = button;
    this.activeHeader = this.getHeader(button);
    this.isTransitioning = false;

    // Set the current table and tab based on the button
    if (button === 'fleet') {
      this.currentTable = 'fleet';
      this.currentTab = 'fleet';
    } else {
      this.currentTable = button;
      this.currentTab = button;
    }
  }

  setFleetTab(tab: string): void {
    this.fleetTab = tab;
  }

  startDate: Date | null = null;
  endDate: Date | null = null;
  minDate!: string;
  maxDate!: string;

  // yet to work..
  showTable(table: string) {
    this.currentTable = table;
    this.setPaginatedData();
    this.filterData();
    this.searchTerm = ''; // Clear the search term
    this.startDate = null; // Clear the start date
    this.endDate = null; // Clear the end date

    // Clear filtered data based on the current table
    if (this.currentTable === 'environment') {
      this.filteredEnvData = [...this.EnvData]; // Reset to the original data
    } else if (this.currentTable === 'robot') {
      this.filteredRobotData = [...this.robotData]; // Reset to the original data
      this.fetchRobos();
    }
    // this.filterData();
  }
  searchTermChanged() {
    this.filterData();
  }

  filterData() {
    const term = this.searchTerm.toLowerCase();

    if (this.currentTable === 'Environment') {
      this.filteredEnvData = this.EnvData.filter((item) => {
        const date = new Date(item.date);
        const normalizedDate = this.normalizeDate(date); // Normalize the item's date
        const withinDateRange =
          (!this.startDate ||
            normalizedDate >= this.normalizeDate(this.startDate)) &&
          (!this.endDate || normalizedDate <= this.normalizeDate(this.endDate)); // Normalize the end date

        return (
          (item.mapName.toLowerCase().includes(term) ||
            item.siteName.toLowerCase().includes(term) ||
            item.date.toLowerCase().includes(term)) &&
          withinDateRange
        );
      });
      // console.log(this.startDate);
      // console.log(this.endDate);

      // Reset paginator to the first page and update paginated data
      if (this.paginator) {
        this.paginator.pageIndex = 0; // Reset to the first page after filtering
      }
      // this.ngOnInit();
      this.setPaginatedData(); // Trigger pagination logic after filtering
    }
  }

  resetFilters() {
    this.searchTerm = ''; // Reset search term
    this.startDate = null; // Reset start date
    this.endDate = null; // Reset end date
    this.filteredEnvData = [...this.EnvData]; // Reset environment data filter
    this.filteredRobotData = [...this.robotData]; // Reset robot data filter
  }
  // onDateFilterChange(event: Event): void {
  //   const selectElement = event.target as HTMLSelectElement;
  //   const filter = selectElement?.value || '';
  //   // Implement your date filter logic here
  // }

  // Function to format date to 'YYYY-MM-DD' format for input type="date"
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  // onDateChange(event: any) { old
  //   const input = event.target as HTMLInputElement;
  //   const id = input.id;
  //   const value = input.value;

  //   if (id === 'start-date' ) {
  //     this.startDate = value ? new Date(value) : null;
  //   } else if (id === 'end-date') {
  //     this.endDate = value ? new Date(value) : null;
  //   }

  //   this.filterData(); // Apply filters whenever the date changes
  // }
  onDateChange(value: string, field: 'start' | 'end') {
    //new
    if (field === 'start') {
      this.startDate = value ? new Date(value) : null;
    } else if (field === 'end') {
      this.endDate = value ? new Date(value) : null;
    }
    this.filterData(); // Call filter logic after date change
  }

  // onDateChange(event: any) {  //recent
  //   const selectedDate = event.target.value;  // This is in 'YYYY-MM-DD' format
  //   if (event.target.id === 'start-date') {
  //     this.startDate = selectedDate;
  //   } else if (event.target.id === 'end-date') {
  //     this.endDate = selectedDate;
  //   }
  //   this.filterData();  // Call your filter function after setting the date
  // }
  setCurrentTable(table: string) {
    this.currentTable = table;
  }

  getCurrentTableData() {
    switch (this.currentTable) {
      case 'Environment':
        return this.EnvData;
      case 'robot':
        return this.robotData;
      default:
        return [];
    }
  }

  getHeader(button: string): string {
    switch (button) {
      case 'Environment':
        return 'Environment';
      case 'robot':
        return 'Robot';
      case 'fleet':
        return 'Fleet';
      default:
        return 'Environment';
    }
  }

  showPopup() {
    this.isPopupVisible = true;
  }


  onCurrEditMapChange(currEditMap: boolean) {
    this.currEditMap = currEditMap;
  }
  editItem(item: any) {
    this.editLoader=true;
    if (this.currEditMap) {
      this.currEditMap = true;
    }
    fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${item.mapName}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    )
      .then((response) =>
        { 
          return response.json()
        }
      )
      .then((data) => {
        if (!data.map) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Map does not exist.',
          });
          return;
        }

        if (data.error) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error fetching map: ${data.error}`,
          });
          return;
        }

        const { map } = data;
        const mapImgUrl = `http://${map.imgUrl}`;

        // Check if the image URL is accessible
        this.checkImageLoading(mapImgUrl)
          .then(() => {
            // Proceed only if the image loads successfully
            this.currEditMapDet = {
              mapName: map.mapName,
              siteName: item.siteName,
              ratio: map.mpp,
              imgUrl: mapImgUrl,
              origin: map.origin,
              nodes: map.nodes,
              edges: map.edges,
              assets: map.stations,
              zones: map.zones,
              robos: map.roboPos,
            };
            this.currEditMap = true;
            this.showImageUploadPopup = true;
            this.editLoader=false

            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Map data loaded successfully.',
            });
          })
          .catch(() => {
            // Handle the case where the image fails to load
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail:
                'Failed to load map image. Please check the image URL or cookies.',
            });
          });
      })
      .catch((err) => {
        console.log(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'An error occurred while fetching map data.',
        });
      });
  }

  // Helper method to check if an image URL loads successfully
  private checkImageLoading(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;

      img.onload = () => resolve(); // Image loaded successfully
      img.onerror = () => reject(); // Error loading the image
    });
  }

  async deleteMap(map: any): Promise<boolean> {
    try {
      const response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${map.mapName}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            projectName: this.mapData?.projectName,
            siteName: map.siteName,
          }),
        }
      );
      // if (!response.ok)
      //   console.error('Error while fetching map data : ', response.status);
      let data = await response.json();
      if (data.isDeleted) return true;
      if (data.isMapExist === false) {
        alert(data.msg);
        return false;
      }
      return false;
    } catch (error) {
      console.log('Err occured : ', error);
      console.error('Error occurred: ', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred while deleting the map.',
      });
      return false;
    }
  }

  showConfirmationDialog: boolean = false;
  itemToDelete: any;

  openDeleteConfirmation(item: any) {
    this.itemToDelete = item;
    this.showConfirmationDialog = true;
  }

  confirmDelete() {
    this.showConfirmationDialog = false;
    this.deleteItemConfirmed(this.itemToDelete);
  }

  cancelDelete() {
    this.showConfirmationDialog = false;
    this.itemToDelete = null;
  }

  deleteItemConfirmed(item: any) {
    let isDeleted = false;

    this.deleteMap(item).then((result) => {
      isDeleted = result;
      if (isDeleted) {
        if (item.id === this.projectService.getMapData().id) {
          this.projectService.setIsMapSet(false);
          this.projectService.clearMapData();
        }

        if (this.currentTable === 'Environment') {
          this.EnvData = this.EnvData.filter((i) => i !== item);
          this.filteredEnvData = this.EnvData;
          this.cdRef.detectChanges();
        } else if (this.currentTable === 'robot') {
          this.filteredRobotData = this.robotData.filter((i) => i !== item);
          this.cdRef.detectChanges();
          this.reloadTable();
          this.setPaginatedData();
        }

        // console.log('line 1438');
        this.ngOnInit();
        this.reloadTable();
        console.log(this.paginatedData, 'page data');
        if (this.paginatedData.length == 0) {
          this.projectService.setInitializeMapSelected(false);
        }
        console.log('Item deleted:', item);
        // console.log(this.paginatedData1,'2page data')
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Item successfully deleted!',
        });
      }
    });
  }

  addItem(item: any) {
    console.log('Add item:', item);
    this.messageService.add({
      severity: 'info',
      summary: 'Add Item',
      detail: 'Item added successfully.',
    });
  }

  blockItem(item: any) {
    console.log('Block item:', item);
    this.messageService.add({
      severity: 'warn',
      summary: 'Block Item',
      detail: 'Item blocked.',
    });
  }

  isPPPopupOpen: boolean = false;
  newItem: any = {};
  isPhysicalParametersFormVisible: boolean = false;
  // isTypeSpecificationFormVisible = false;
  // isProtocolLimitsFormVisible = false;
  // isProtocolFeaturesFormVisible = false;
  // isAGVGeometryFormVisible = false;
  // isLoadSpecificationFormVisible = false;
  // isLocalizationParametersFormVisible = false;
  formData = {
    robotName: '',
    manufacturer: '',
    serialNumber: '',
    attachmentType: 'NOT_SET',
    typeSpecification: {
      seriesName: '',
      seriesDescription: '',
      agvKinematic: '',
      agvClass: '',
      maxLoadMass: 0,
      localizationTypes: '',
      navigationTypes: '',
    },
    protocolLimits: {
      maxStringLens: '',
      maxArrayLens: '',
      timing: '',
    },
    protocolFeatures: {
      optionalParameters: '',
      actionScopes: '',
      actionParameters: '',
      resultDescription: '',
    },
    agvGeometry: {
      wheelDefinitions: '',
      envelopes2d: '',
      envelopes3d: '',
    },
    loadSpecification: {
      loadPositions: '',
      loadSets: '',
    },
    localizationParameters: {
      type: '',
      description: '',
    },
  };
  reset() {
    this.formData = {
      robotName: '',
      manufacturer: '',
      serialNumber: '',
      attachmentType: 'NOT_SET',
      typeSpecification: {
        seriesName: '',
        seriesDescription: '',
        agvKinematic: '',
        agvClass: undefined as any | undefined,
        maxLoadMass: 0,
        localizationTypes: '',
        navigationTypes: '',
      },
      protocolLimits: {
        maxStringLens: '',
        maxArrayLens: '',
        timing: '',
      },
      protocolFeatures: {
        optionalParameters: '',
        actionScopes: '',
        actionParameters: '',
        resultDescription: '',
      },
      agvGeometry: {
        wheelDefinitions: '',
        envelopes2d: '',
        envelopes3d: '',
      },
      loadSpecification: {
        loadPositions: '',
        loadSets: '',
      },
      localizationParameters: {
        type: '',
        description: '',
      },
    };
  }

  // cities: any[] | undefined;

  // selectedCity: DB | undefined;

  // Method to close all forms
  closeAllForms(): void {
    this.isTypeSpecificationFormVisible = false;
    this.isProtocolLimitsFormVisible = false;
    this.isProtocolFeaturesFormVisible = false;
    this.isAGVGeometryFormVisible = false;
    this.isLoadSpecificationFormVisible = false;
    this.isLocalizationParametersFormVisible = false;
  }

  // Toggle Type Specification Form
  toggleTypeSpecificationForm(event: Event): void {
    event.preventDefault();
    this.closeAllForms();
    this.isTypeSpecificationFormVisible = !this.isTypeSpecificationFormVisible;
    this.cdRef.detectChanges();
  }

  // Toggle Protocol Limits Form
  toggleProtocolLimitsForm(event: Event): void {
    event.preventDefault();
    this.closeAllForms();
    this.isProtocolLimitsFormVisible = !this.isProtocolLimitsFormVisible;
    this.cdRef.detectChanges();
  }

  // Toggle Protocol Features Form
  toggleProtocolFeaturesForm(event: Event): void {
    event.preventDefault();
    this.closeAllForms();
    this.isProtocolFeaturesFormVisible = !this.isProtocolFeaturesFormVisible;
    this.cdRef.detectChanges();
  }

  // Toggle AGV Geometry Form
  toggleAGVGeometryForm(event: Event): void {
    event.preventDefault();
    this.closeAllForms();
    this.isAGVGeometryFormVisible = !this.isAGVGeometryFormVisible;
    this.cdRef.detectChanges();
  }

  // Toggle Load Specification Form
  toggleLoadSpecificationForm(event: Event): void {
    event.preventDefault();
    this.closeAllForms();
    this.isLoadSpecificationFormVisible = !this.isLoadSpecificationFormVisible;
    this.cdRef.detectChanges();
  }

  // Toggle Localization Parameters Form
  toggleLocalizationParametersForm(event: Event): void {
    event.preventDefault();
    this.closeAllForms();
    this.isLocalizationParametersFormVisible =
      !this.isLocalizationParametersFormVisible;
    this.cdRef.detectChanges();
  }

  // Close form methods (if needed individually)
  closeTypeSpecificationForm(): void {
    this.isTypeSpecificationFormVisible = false;
    this.cdRef.detectChanges();
  }

  closeProtocolLimitsForm(): void {
    this.isProtocolLimitsFormVisible = false;
    this.cdRef.detectChanges();
  }

  closeProtocolFeaturesForm(): void {
    this.isProtocolFeaturesFormVisible = false;
    this.cdRef.detectChanges();
  }

  closeAGVGeometryForm(): void {
    this.isAGVGeometryFormVisible = false;
    this.cdRef.detectChanges();
  }

  closeLoadSpecificationForm(): void {
    this.isLoadSpecificationFormVisible = false;
    this.cdRef.detectChanges();
  }

  closeLocalizationParametersForm(): void {
    console.log('Close icon clicked');
    this.isLocalizationParametersFormVisible = false;
    this.cdRef.detectChanges();
  }

  // Save methods for each form
  saveTypeSpecification(): void {
    console.log('Type Specification saved:', this.formData.typeSpecification);
    this.closeTypeSpecificationForm();
    // this.cdRef.detectChanges();
  }

  saveProtocolLimits(): void {
    console.log('Protocol Limits saved:', this.formData.protocolLimits);
    this.closeProtocolLimitsForm();
    this.cdRef.detectChanges();
  }

  saveProtocolFeatures(): void {
    console.log('Protocol Features saved:', this.formData.protocolFeatures);
    this.closeProtocolFeaturesForm();
    this.cdRef.detectChanges();
  }

  saveAGVGeometry(): void {
    console.log('AGV Geometry saved:', this.formData.agvGeometry);
    this.closeAGVGeometryForm();
    this.cdRef.detectChanges();
  }

  saveLoadSpecification(): void {
    console.log('Load Specification saved:', this.formData.loadSpecification);
    this.closeLoadSpecificationForm();
    this.cdRef.detectChanges();
  }

  saveLocalizationParameters(): void {
    console.log(
      'Localization Parameters saved:',
      this.formData.localizationParameters
    );
    this.closeLocalizationParametersForm();
    this.cdRef.detectChanges();
  }

  saveItem(): void {
    this.isPopupOpen = false;

    this.cdRef.detectChanges();
  }

  // handle the data here..
  saveRoboInfo(): void {
    // roboName | serial Number, ip add, mac add, grossInfo
    let project = this.projectService.getSelectedProject();
    let currMap = this.projectService.getMapData();
    if (!project || !currMap) {
      alert('map not selected');
      return;
    }
    if (this.isRoboInEdit) {
      this.updateRobo();
      return;
    }
    let amrId = 0;
    if (this.robotData.length)
      amrId = this.robotData[this.robotData.length - 1].amrId + 1;
    const dateInSecs = Math.round(Date.now() / 1000);
    let uuid = parseInt(dateInSecs.toString().slice(-8));

    const roboDetails = {
      projectName: project.projectName,
      mapId: currMap.id,
      mapName: currMap.mapName,
      roboName: this.formData.robotName,
      amrId: amrId,
      uuid: uuid,
      // isSimMode : false,
      ipAdd: this.currentRoboDet.ip,
      macAdd: this.currentRoboDet.mac,
      grossInfo: this.formData,
    };
    if (roboDetails.roboName === '' || this.formData.manufacturer === '') {
      alert('Manufacturer or roboname should be there');
      return;
    }
    fetch(
      `http://${environment.API_URL}:${environment.PORT}/robo-configuration`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(roboDetails),
      }
    )
      .then((response) => {
        if (response.status === 422)
          console.log(
            'Error while inserting reference Id in server, unprocessable entity'
          );
        // if (!response.ok)
        //   throw new Error(`Err with status code of ${response.status}`);
        return response.json();
      })
      .then((data) => {
        // console.log(data);
        if (data.error) return;
        else if (data.isIpMacExists) {
          console.log(data.msg);
          alert('Ip | Mac seems already exists!');
          return;
        } else if (data.exists) {
          alert('Robo Name already exists');
          return;
        }
        if (data.robo) {
          this.robotData = [...this.robotData, data.robo];
          // console.log('line 1768');
          this.ngOnInit();
          // this.filteredRobotData = [...this.robotData];
          // this.cdRef.detectChanges();
          // alert('robo Added to db');
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Robo Added to Database Successfully!.',
          });
          return;
        }
      });

    this.isPopupOpen = false;
    // console.log('line 1783');
    this.ngOnInit();
    this.cdRef.detectChanges();
  }

  closeroboPopup(): void {
    this.isPopupOpen = false;
    this.cdRef.detectChanges();
  }

  openPopup(item: any) {
    // Reset all form section visibility flags
    this.isRoboInEdit = false;
    this.isTypeSpecificationFormVisible = false;
    this.isProtocolLimitsFormVisible = false;
    this.isProtocolFeaturesFormVisible = false;
    this.isAGVGeometryFormVisible = false;
    this.isLoadSpecificationFormVisible = false;
    this.isLocalizationParametersFormVisible = false;
    this.currentRoboDet = item;
    this.isPopupOpen = !this.isPopupOpen;
    this.reset();
    // this.newItem = { ...item }; // Initialize with the clicked item's data
    this.cdRef.detectChanges();
  }
  closePPPopup() {
    this.isPhysicalParametersFormVisible =
      !this.isPhysicalParametersFormVisible;
  }
  savePPItem() {
    this.isPhysicalParametersFormVisible =
      !this.isPhysicalParametersFormVisible;
  }

  // simulation robots

  isMapAvailable(): boolean {
    return this.selectedMap != null && this.selectedMap.mapName != null ;
  }

  async togglePopup() {
    console.log('Selected Map:', this.selectedMap);

    if (!this.isMapAvailable()) {
      console.log('Map is not available, showing alert.');
      alert('Please create or select a map to simulate the robots.');
      return;
    }

    let simRobos = await this.getSimRobos(this.selectedMap);
    this.totalRobots = simRobos ? simRobos.length : 0;
    this.isPopupVisible = !this.isPopupVisible;
  }

  robotCount: number = 0;
  totalRobots: number = 0;

  async getSimRobos(map: any): Promise<any> {
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${map?.mapName}`
    );
    if (!response.ok) {
      console.error('Error while fetching map data : ', response.status);
      return;
    }
    let data = await response.json();
    if (!data.error) return data.map.simMode;
  }
  closePopup() {
    this.isPopupVisible = false;
    this.isImageOpened = false;
    this.chosenImageName = '';
    this.imageHeight = 0;
    this.imageWidth = 0;
    this.robotCountError = false;
    this.robotCount=0;
  }
  
  robotCountError: boolean = false;
  async addRobot() {
    // Check for valid robot count
    if (this.robotCount <= 0) {
      this.robotCountError = true;
      return;
    }

    // Limit to a maximum of 10 robots in total
    if (this.robotCount + this.totalRobots > 10) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Total robots cannot exceed 10.',
        life: 4000,
      });
      
      return;
    }

    // Fetch the current simRobos data to retain existing robots
    let existingSimRobos = (await this.getSimRobos(this.selectedMap)) || [];

    // Create new robots based on robotCount
    let newRobots = [];
    for (let i = 0; i < this.robotCount; i++) {
      newRobots.push({
        amrId: existingSimRobos.length + i, // ID based on total robots
        roboName: `MR${existingSimRobos.length + i}00`, // Unique name
        enable: false,
        isInitialized: false,
        imgState: '',
        pos: { x: existingSimRobos.length + i, y: 0, orientation: 0 },
      });
    }

    // Combine existing robots with the new robots
    const updatedSimRobos = [...existingSimRobos, ...newRobots];

    // Update the map with the new list of robots
    let sims = await this.updateSimInMap(updatedSimRobos);
    if (sims) {
      this.messageService.add({
        severity: 'info',
        summary: 'Info',
        detail: 'Robots are added for Simulation',
        life: 4000,
      });
    }
        
    this.robotCountError = false;
    // Update the totalRobots count to reflect all robots now in sim mode
    this.totalRobots = updatedSimRobos.length;

    // Reset the robotCount input field
    this.robotCount = 0;
  }

  async clearAllRobots() {
    try {
      if (this.totalRobots === 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No Robots to Delete',
          life: 4000,
        });
        return;
      }

      // Set the robots list to an empty array to clear all robots
      const updatedSimRobos: any[] = [];

      // Update the backend with the empty list of robots
      let result = await this.updateSimInMap(updatedSimRobos);
      if (result) {
          this.messageService.add({
          severity: 'info',
          summary: 'Info',
          detail: 'All robots deleted!',
          life: 4000,
        });

        // Reset the local totalRobots count
        this.totalRobots = 0;
      } else {
        console.error('Failed to clear robots on the backend.');
      }
    } catch (error) {
      console.error('Error during clearing robots:', error);
    }
  }

  async deleteRobot(amrId: number) {
    try {
      if (this.totalRobots === 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No Robots to Delete',
          life: 4000,
        });
        return;
      }

      // Fetch the current simRobos data
      let existingSimRobos = (await this.getSimRobos(this.selectedMap)) || [];

      // Check if the robot with the given amrId exists
      const robotToDelete = existingSimRobos.find(
        (robot: { amrId: number }) => robot.amrId === amrId
      );
      if (!robotToDelete) {
        alert(`Robot with ID ${amrId} not found.`);
        return;
      }

      // Filter out the robot to be deleted
      const updatedSimRobos = existingSimRobos.filter((robot: { amrId: number; }) => robot.amrId !== amrId);  
      // Update the backend with the updated list of robots
      let result = await this.updateSimInMap(updatedSimRobos);
      if (result) {
        alert(`Robot with ID ${amrId} deleted!`);

        // Update the local totalRobots count
        this.totalRobots = updatedSimRobos.length;
      } else {
        alert('Failed to delete the robot from the backend.');
      }
    } catch (error) {
      console.error('Error during robot deletion:', error);
    }
  }
}
