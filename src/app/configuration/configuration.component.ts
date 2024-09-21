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
import { AnyAaaaRecord } from 'node:dns';
import { PageEvent } from '@angular/material/paginator';
import { log } from 'node:console';

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
  styleUrls: ['./configuration.component.css'],
  encapsulation: ViewEncapsulation.ShadowDom, // Use shadow DOM to isolate styles
})
export class ConfigurationComponent implements AfterViewInit {
  // @ViewChild(EnvmapComponent) envmapComponent!: EnvmapComponent;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('uploadedCanvas', { static: false })
  uploadedCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('overlayLayer', { static: false }) overlayLayer!: ElementRef;

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

  searchTerm: string = '';
  filteredEnvData: any[] = [];
  filteredTaskData: any[] = [];
  filteredRobotData: any[] = [];

  isPopupOpen: boolean = false;
  isScanning = false;
  EnvData: any[] = []; // map details..
  currentRoboDet: any | null = null;

  currEditMap: boolean = false;
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

  constructor(
    private cdRef: ChangeDetectorRef,
    private projectService: ProjectService,
    public dialog: MatDialog // Inject MatDialog
  ) {
    this.filteredEnvData = this.EnvData;
    this.filteredRobotData = this.robotData;
  }

  ngOnInit() {
    this.cdRef.detectChanges();
    const today = new Date();
    const pastFiveYears = new Date();
    pastFiveYears.setFullYear(today.getFullYear() - 5);

    this.minDate = this.formatDate(pastFiveYears);
    this.maxDate = this.formatDate(today);
    let currMapData = this.projectService.getMapData();
    if (currMapData) {
      this.selectedMap = currMapData;
    }

    this.mapData = this.projectService.getSelectedProject(); // _id
    if (!this.mapData) return;
    fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-project/${this.mapData._id}`,
      { credentials: 'include' }
    )
      .then((response) => {
        if (!response.ok) throw new Error(`Error code of ${response.status}`);
        return response.json();
      })
      .then(async (data) => {
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
                second: 'numeric',
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
        this.filteredEnvData = this.EnvData;
        // this.cdRef.detectChanges();
        if (!this.projectService.getIsMapSet()) {
          this.selectedMap = this.EnvData[0];
          let imgUrl = '';
          if (this.EnvData[0]) {
            imgUrl = await this.getMapImgUrl(this.selectedMap);
            this.projectService.setMapData({
              ...this.EnvData[0],
              imgUrl: imgUrl,
            });
            this.projectService.setIsMapSet(true);
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });

    this.fetchRobos(); // fetch all robots..

    if (!this.EnvData.length) return;

    // fetch(
    //   `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${this.EnvData[0]?.mapName}`
    // )
    //   .then((response) => {
    //     if (!response.ok) {
    //       console.error('Error while fetching map data : ', response.status);
    //       throw new Error('Error while fetching map data');
    //     }
    //     return response.json();
    //   })
    //   .then((data) => {
    //     if (!this.projectService.getMapData())
    //       // yet to remove..
    //       this.projectService.setMapData({
    //         ...this.EnvData[0],
    //         imgUrl: data.map.imgUrl,
    //       });
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //   });
    this.filteredEnvData = this.EnvData;
    this.searchTerm = '';
    this.searchTermChanged();
  }

  fetchRobos() {
    let mapData = this.projectService.getMapData();
    if (!mapData) return;

    fetch(
      `http://${environment.API_URL}:${environment.PORT}/robo-configuration/get-robos/${mapData.id}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    )
      .then((response) => {
        if (response.status == 422) {
          console.log('Invalid map id, which request to fetch robots');
          return;
        }
        return response.json();
      })
      .then((data) => {
        console.log(data);
        if (data.error) return;
        if (data.populatedRobos) this.robotData = data.populatedRobos;
        this.filteredRobotData = this.robotData;
      })
      .catch((error) => {
        console.log(error);
      });
  }

  editRobo(robo: any) {}

  deleteRobo(robo: any) {
    let project = this.projectService.getSelectedProject();
    let map = this.projectService.getMapData();
    let roboInfo = {
      roboId: robo._id,
      projectName: project.projectName,
      mapName: map.mapName,
    };
    fetch(
      `http://${environment.API_URL}:${environment.PORT}/robo-configuration`,
      {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roboInfo),
      }
    )
      .then((response) => {
        // if (response.ok) {
        //   this.robotData = this.robotData.filter(
        //     (robo) => robo._id !== roboInfo.roboId
        //   );
        //   return;
        // }
        return response.json();
      })
      .then((data) => {
        console.log(data);
        if (data.isRoboExists) this.fetchRobos();
        // if(data.isrob)
      })
      .catch((error) => {
        console.log(error);
      });
  }

  onPageChange(event: PageEvent) {
    this.setPaginatedData();
  }
  setPaginatedData() {
    throw new Error('Method not implemented.');
  }

  async selectMap(map: any) {
    if (this.selectedMap?.id === map.id) {
      // Deselect if the same map is clicked again
      this.projectService.clearMapData();
      this.projectService.setIsMapSet(false);
      if (!this.EnvData.length) return;
      this.selectedMap = this.EnvData[0];
      // const response = await fetch(
      //   `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${this.EnvData[0]?.mapName}`
      // );
      // if (!response.ok)
      //   console.error('Error while fetching map data : ', response.status);
      // let data = await response.json();
      // let { map } = data;
      this.ngOnInit();
      if (this.projectService.getIsMapSet()) return;
      // this.projectService.setIsMapSet(true);
      return;
    }
    // Select a new map
    this.selectedMap = map;
    if (!this.EnvData.length) return;
    this.projectService.clearMapData();
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
    if (
      this.selectedMap?.id === item.id &&
      this.selectedMap?.mapName === item.mapName
    )
      return false;
    return true;
    // return this.selectedMap && this.selectedMap !== item;
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
  normalizeDate(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  selectedrobotData = [
    { column1: '192.168.XX.XX', column2: ' ' },
    { column1: '192.168.XX.XX', column2: ' ' },
  ];
  ipScanData: Poll[] = [];

  loadData() {
    // Fetch or initialize data here
    this.EnvData = []; // Replace with actual data fetching
    this.filterData(); // Initial filter application
  }

  ngAfterViewInit() {}

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

  async startScanning() {
    this.ipScanData = [];
    if (this.startIP === '' || this.EndIP === '') {
      alert('Enter valid Ip');
      return;
    }
    const ipv4Regex =
      /^(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipv4Regex.test(this.startIP) || !ipv4Regex.test(this.EndIP)) {
      alert('not valid IP. Try again');
      return;
    }

    const URL = `http://${environment.API_URL}:${environment.PORT}/fleet-config/scan-ip/${this.startIP}-${this.EndIP}`;

    const response = await fetch(URL, { method: 'GET' });

    if (response.status === 422) {
      alert(`Ip range is too large`);
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
        this.cdRef.detectChanges();
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.eventSource.close();
      this.isScanning = false;
      this.cdRef.detectChanges();
    };
    this.isScanning = true;
  }
  stopScanning() {
    this.isScanning = false;
    this.eventSource.close();
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
    this.showImageUploadPopup = true;
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

  searchTermChanged() {
    this.filterData();
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
    this.isTransitioning = true;

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
    // Clear search term and reset date inputs when switching between tabs
    // Clear search term and reset date inputs when switching between tabs
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
    } else if (this.currentTable === 'robot') {
      this.filteredRobotData = this.robotData.filter(
        (item) =>
          item.roboName.toLowerCase().includes(term) ||
          item.ipAdd.toLowerCase().includes(term)
      );
    }
  }

  onDateFilterChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const filter = selectElement?.value || '';
    // Implement your date filter logic here
  }

  // Function to format date to 'YYYY-MM-DD' format for input type="date"
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  onDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const id = input.id;
    const value = input.value;

    if (id === 'start-date') {
      this.startDate = value ? new Date(value) : null;
    } else if (id === 'end-date') {
      this.endDate = value ? new Date(value) : null;
    }

    this.filterData(); // Apply filters whenever the date changes
  }

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

  closePopup() {
    this.isPopupVisible = false;
    this.isImageOpened = false;
    this.chosenImageName = '';
    this.imageHeight = 0;
    this.imageWidth = 0;
  }
  onCurrEditMapChange(currEditMap: boolean) {
    this.currEditMap = currEditMap;
  }
  editItem(item: any) {
    fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${item.mapName}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    )
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (!data.map) {
          alert('Seems map not exist');
          return;
        }
        if (data.error) {
          console.log('Error while fetching map : ', data.error);
          return;
        }
        const { map } = data;
        this.currEditMapDet = {
          mapName: map.mapName,
          siteName: item.siteName,
          ratio: map.mpp,
          imgUrl: `http://${map.imgUrl}`,
          nodes: map.nodes,
          edges: map.edges,
          assets: map.stations,
          zones: map.zones,
          robos: map.roboPos,
        };
        this.currEditMap = true;
        this.showImageUploadPopup = true;
        // console.log(map.mapName, item.siteName, map.mpp, map.imgUrl);
      })
      .catch((err) => {
        console.log(err);
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
      return false;
    }
  }

  deleteItem(item: any) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent);
    let isDeleted = false;

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) isDeleted = await this.deleteMap(item);
      if (isDeleted) {
        this.projectService.setIsMapSet(false);
        this.projectService.clearMapData();
        this.ngOnInit();
        // Assuming `currentTable` determines which data array to modify
        if (this.currentTable === 'Environment') {
          this.EnvData = this.EnvData.filter((i) => i !== item);
          this.filteredEnvData = this.EnvData;
          this.cdRef.detectChanges();
        } else if (this.currentTable === 'robot') {
          this.filteredRobotData = this.filteredRobotData.filter(
            (i) => i !== item
          );
        }
        console.log('Item deleted:', item);
      }
    });
  }

  addItem(item: any) {
    console.log('Add item:', item);
  }

  blockItem(item: any) {
    console.log('Block item:', item);
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
    const roboDetails = {
      projectName: project.projectName,
      mapId: currMap.id,
      mapName: currMap.mapName,
      roboName: this.formData.serialNumber,
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
        console.log(data);
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
          this.filteredRobotData = this.robotData;
          this.cdRef.detectChanges();
          // alert('robo Added to db');
          return;
        }
      });
    this.isPopupOpen = false;
    this.cdRef.detectChanges();
  }

  closeroboPopup(): void {
    this.isPopupOpen = false;
    this.cdRef.detectChanges();
  }
  openPopup(item: any) {
    this.currentRoboDet = item;
    this.isPopupOpen = !this.isPopupOpen;
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
}
