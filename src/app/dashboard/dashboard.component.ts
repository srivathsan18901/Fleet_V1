import {
  Component,
  AfterViewInit,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  EventEmitter,
  Output,
  OnDestroy,
  HostListener,
} from '@angular/core';
import RecordRTC from 'recordrtc';
import { ProjectService } from '../services/project.service';
import { environment } from '../../environments/environment.development';
import { UptimeComponent } from '../uptime/uptime.component';
import { ThroughputComponent } from '../throughput/throughput.component';
import { MessageService, PrimeIcons } from 'primeng/api';
import { IsFleetService } from '../services/shared/is-fleet.service';
import { ModeService } from './mode.service';
import { Subscription } from 'rxjs';
import { NodeGraphService } from '../services/nodegraph.service';
import { HeatmapService } from '../services/heatmap-service.service';
import { log } from 'node:console';

enum ZoneType {
  HIGH_SPEED_ZONE = 'High Speed Zone',
  MEDIUM_SPEED_ZONE = 'Medium Speed Zone',
  SLOW_SPEED_ZONE = 'Slow Speed Zone',
  MUTED_SPEED_ZONE = 'Muted Speed Zone',
  TURNING_SPEED_ZONE = 'Turning Speed Zone',
  IN_PLACE_SPEED_ZONE = 'In Place Speed Zone',
  CHARGING_ZONE = 'Charging Zone',
  PREFERRED_ZONE = 'Preferred Zone',
  UNPREFERRED_ZONE = 'Unpreferred Zone',
  KEEPOUT_ZONE = 'Keepout Zone',
  CRITICAL_SAFETY_ZONE = 'Critical Safety Zone',
  BLIND_LOCALISATION_ZONE = 'Blind Localisation Zone',
  DENSE_ZONE = 'Dense Zone',
  STRICTLY_PATH_ZONE = 'Strictly Path Zone',
  OBSTACLE_AVOIDANCE_ZONE = 'Obstacle Avoidance Zone',
  EMERGENCY_ZONE = 'Emergency Zone',
  MAINTENANCE_ZONE = 'Maintenance Zone',
  PARKING_ZONE = 'Parking Zone',
}
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements AfterViewInit {
  @ViewChild('dashboardContainer', { static: false })
  dashboardContainer!: ElementRef;
  @ViewChild('robot0', { static: false }) robot0Path!: ElementRef;
  @ViewChild('robotTooltip', { static: true }) robotTooltip!: ElementRef;
  @ViewChild(UptimeComponent) UptimeComponent!: UptimeComponent;
  @ViewChild(ThroughputComponent) throughputComponent!: ThroughputComponent;
  @ViewChild('myCanvas', { static: false })
  myCanvas!: ElementRef<HTMLCanvasElement>;
  @Output() modeChange = new EventEmitter<string>(); // Create an event emitter
  eventSource!: EventSource;
  posEventSource!: EventSource;
  assetEventSource!: EventSource;
  ONBtn = false;
  showDashboard = false;
  isDropdownOpen = false;
  selectedFloor = 'Floor 1';
  floors = ['Floor 1'];
  zoomLevel = 1.0;
  originalRoboPositions = [];
  isPanning = false;
  lastX = 0;
  lastY = 0;
  offsetX = 0;
  offsetY = 0;
  mapDetails: any | null = null;
  nodes: any[] = [];
  edges: any[] = [];
  zones: any[] = [];
  assets: any[] = [];
  simMode: any[] = [];
  robos: any[] = [];
  racks: any[] = [];
  ratio: number = 1;
  origin: { x: number; y: number; w: number } = { x: 0, y: 0, w: 0 };
  plottedPoints: { id: number; x: number; y: number }[] = [];
  zoneType: ZoneType | null = null; // Selected zone type
  startX = 0;
  startY = 0;
  showChart2 = true; // Controls blur effect for Chart2
  showChart3 = true;
  assetImages: { [key: string]: HTMLImageElement } = {};
  zoneColors: { [key in ZoneType]: string } = {
    [ZoneType.HIGH_SPEED_ZONE]: 'rgba(255, 0, 0, 0.3)', // Red with 30% opacity
    [ZoneType.MEDIUM_SPEED_ZONE]: 'rgba(255, 165, 0, 0.3)', // Orange with 30% opacity
    [ZoneType.SLOW_SPEED_ZONE]: 'rgba(255, 255, 0, 0.3)', // Yellow with 30% opacity
    [ZoneType.MUTED_SPEED_ZONE]: 'rgba(0, 128, 0, 0.3)', // Green with 30% opacity
    [ZoneType.TURNING_SPEED_ZONE]: 'rgba(0, 0, 255, 0.3)', // Blue with 30% opacity
    [ZoneType.IN_PLACE_SPEED_ZONE]: 'rgba(75, 0, 130, 0.3)', // Indigo with 30% opacity
    [ZoneType.CHARGING_ZONE]: 'rgba(238, 130, 238, 0.3)', // Violet with 30% opacity
    [ZoneType.PREFERRED_ZONE]: 'rgba(0, 255, 255, 0.3)', // Cyan with 30% opacity
    [ZoneType.UNPREFERRED_ZONE]: 'rgba(128, 0, 128, 0.3)', // Purple with 30% opacity
    [ZoneType.KEEPOUT_ZONE]: 'rgba(255, 69, 0, 0.3)', // OrangeRed with 30% opacity
    [ZoneType.CRITICAL_SAFETY_ZONE]: 'rgba(255, 20, 147, 0.3)', // DeepPink with 30% opacity
    [ZoneType.BLIND_LOCALISATION_ZONE]: 'rgba(127, 255, 0, 0.3)', // Chartreuse with 30% opacity
    [ZoneType.DENSE_ZONE]: 'rgba(220, 20, 60, 0.3)', // Crimson with 30% opacity
    [ZoneType.STRICTLY_PATH_ZONE]: 'rgba(0, 0, 139, 0.3)', // DarkBlue with 30% opacity
    [ZoneType.OBSTACLE_AVOIDANCE_ZONE]: 'rgba(0, 100, 0, 0.3)', // DarkGreen with 30% opacity
    [ZoneType.EMERGENCY_ZONE]: 'rgba(139, 0, 0, 0.3)', // DarkRed with 30% opacity
    [ZoneType.MAINTENANCE_ZONE]: 'rgba(184, 134, 11, 0.3)', // DarkGoldenRod with 30% opacity
    [ZoneType.PARKING_ZONE]: 'rgba(47, 79, 79, 0.3)', // DarkSlateGray with 30% opacity
  };
  zoneTypeList = Object.values(ZoneType); // Converts the enum to an array
  recording = false;
  private recorder: any;
  private stream: MediaStream | null = null; // Store the MediaStream here
  showModelCanvas: boolean = false; // Initially hide the modelCanvas
  assignTask: boolean = false;
  isShowPath: boolean = false;
  isShowRoboPath: boolean = false;
  selectedMap: any | null = null;
  mapImg: any | null = null;
  mapImageWidth: number = 0; // To store the width of the map image
  mapImageHeight: number = 0; // To store the height of the map image
  mapImageX: number = 0; // To store the X position of the map image
  mapImageY: number = 0; // To store the Y position of the map image
  draggingRobo: any = null; // Holds the robot being dragged
  selectedRobo: any = null;
  taskAction: string = 'MOVE';
  roboToAssign: string | null = 'Default';
  sourceLocation: any | null = null;
  currentRoboList: any[] | null = null;
  placeOffset: number = 50;
  robotToInitialize: any = null;
  isInLive: boolean = false;
  isMoveModeActive: boolean = false; // Track if move mode is enabled
  isDragging: boolean = false;
  showHeatMap: boolean = false;
  isMapLoaded = false;
  isImage: boolean = false;
  // genMapImg: any | null = null;
  updatedrobo: any;
  isFleetUp: boolean = false;
  liveRobos: any | null = null;
  // canvas loader
  canvasloader: boolean = true;
  canvasNoImage: boolean = false;
  //  new robot
  isMoving: boolean = true;
  isDocking: boolean = false;
  isCharging: boolean = false;
  shouldAnimate: boolean = true; // Control the animation
  svgFillColor: string = '#FFA3A3'; // Default color
  rackSize: number = 25;
  paths: Map<number, any[]> = new Map<number, any[]>();
  roboPathIds: Set<number> = new Set<number>();

  async deleteRobot(robot: any, index: number) {
    // console.log(robot);
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/dlt-sim-robo`,
      {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapId: this.selectedMap.id,
          roboId: robot.amrId,
        }),
      }
    );
    let data = await response.json();
    if (data.error || !data.isRoboDeleted) return;
    if (data.isRoboDeleted) {
      this.simMode = this.simMode.filter(
        (robo: any) => robot.amrId !== robo.amrId
      );
      this.nodeGraphService.setsimMode(this.simMode);
      this.updateRoboClrs();
      this.redrawCanvas();
    }
    // this.simMode.splice(index, 1);  // Remove robot from the list
  }

  updateRoboClrs() {
    // this.simMode = this.nodeGraphService.getsimMode();
    let colors = [
      '#3357FF',
      '#33FF57',
      '#FF5733',
      '#FF33A6',
      '#FFC300',
      '#1f6600',
      '#fc5661',
      '#a438ba',
      '#00aabd',
      '#472a2a',
    ];
    // clear an roboIdColor
    this.roboIDColor.clear();
    let i = 0;
    for (let robo of this.simMode) {
      this.roboIDColor.set(robo.amrId, colors[i]);
      i++;
      if (i > 9) i -= 10;
    }
    this.nodeGraphService.setRoboIdClr(this.roboIDColor);
  }

  constructor(
    private projectService: ProjectService,
    private cdRef: ChangeDetectorRef,
    private messageService: MessageService,
    private isFleetService: IsFleetService,
    private modeService: ModeService,
    private nodeGraphService: NodeGraphService,
    private heatmapService: HeatmapService
  ) {
    if (this.projectService.getIsMapSet()) return;
    // this.onInitMapImg(); // yet to remove..
  }
  private subscriptions: Subscription[] = [];
  isFleet: boolean = false;

  // PNG icon URLs
  fleetIconUrl: string = '../assets/fleet_icon.png';
  simulationIconUrl: string = '../assets/simulation_icon.png';

  toggleMode() {
    const newState = !this.isFleet; // Calculate the new state
    this.isFleet = newState; // Update the local value of isFleet
    this.isFleetService.setIsFleet(newState); // Update the service state
    sessionStorage.setItem('isFleet', String(newState)); // Save the updated value to session storage
    if (!this.isFleet) {
      this.initSimRoboPos();
    }
    // Trigger any additional actions needed
    this.redrawCanvas();
  }

  toggleHeatmap() {
    this.showHeatMap = !this.showHeatMap;
  }

  // Get the appropriate icon based on the state
  get iconUrl(): string {
    return this.isFleet ? this.fleetIconUrl : this.simulationIconUrl;
  }

  // Get the appropriate label based on the state
  get buttonLabel(): string {
    // console.log("button lable")
    return this.isFleet ? 'Fleet mode' : 'Sim mode';
  }

  // Get the appropriate background color class based on the simmode state
  get buttonClass(): string {
    return this.isFleet ? 'fleet-background' : 'simulation-background';
  }
  async ngOnInit() {
    this.isInLive = this.projectService.getInLive();
    const fleetSub = this.isFleetService.isFleet$.subscribe((status) => {
      this.isFleet = status;
      this.updateUI(); // Update UI based on the current state
    });

    this.subscriptions.push(fleetSub);
    const savedIsFleet = sessionStorage.getItem('isFleet');
    if (savedIsFleet !== null) {
      this.isFleet = savedIsFleet === 'true'; // Convert string to boolean
      this.isFleetService.setIsFleet(this.isFleet); // Sync the state with the service
    }

    this.projectService.isFleetUp$.subscribe((status) => {
      this.isFleetUp = status;
      // console.log(this.isFleetUp);
      if (!this.isFleetUp) {
        this.disableAllRobos();
        this.isInLive = false; // Ensure we're not in live mode if fleet is down
        this.projectService.setInLive(false); // Update the service
      }
    });
    // console.log(this.projectService.getInitializeMapSelected(),'dash board')
    if (this.projectService.getInitializeMapSelected() == 'true') {
      this.canvasloader = true;
      this.projectService.isFleetUp$.subscribe((status) => {
        this.isFleetUp = status;
        if (!this.isFleetUp) {
          this.disableAllRobos();
          this.isInLive = false; // Ensure we're not in live mode if fleet is down
          this.projectService.setInLive(false); // Update the service
        }
      });
      if (this.projectService.getInitializeMapSelected() == 'true') {
        this.canvasloader = true;
        this.selectedMap = this.projectService.getMapData();
      }
    }

    if (this.selectedMap == null) {
      this.canvasloader = false;
      this.canvasNoImage = true;
    }

    if (!this.projectService.getMapData()) return;
    const img = new Image();
    img.src = `http://${environment.API_URL}:${environment.PORT}/${this.selectedMap.imgUrl}`;

    img.onload = () => {
      // Calculate zoom level only once during initialization
      // if (this.zoomLevel) {
      this.zoomLevel = img.width > 1355 || img.height > 664 ? 0.8 : 1.0;
      this.nodeGraphService.setZoomLevel(this.zoomLevel);
      // }
    };
    this.nodeGraphService.setZoomLevel(this.zoomLevel);
    this.nodeGraphService.setOffsetX(this.offsetX); //defaultvalue
    this.nodeGraphService.setOffsetY(this.offsetY); //defaultvalue
    this.nodeGraphService.setIsShowPath(this.isShowPath);
    this.nodeGraphService.setIsShowRoboPath(this.roboPathIds.size);
    // this.roboPathIds.clear();

    await this.getMapDetails();
    // this.showModelCanvas = false;
    this.nodeGraphService.setShowModelCanvas(false);
    this.nodeGraphService.setAssignTask(false);
    this.cdRef.detectChanges();
    this.redrawCanvas(); // yet to look at it... and stay above initSimRoboPos()
    if (!this.isInLive) this.initSimRoboPos();
    this.loadCanvas();
    if (this.posEventSource || this.assetEventSource) {
      this.posEventSource.close();
      this.assetEventSource.close();
    }
    if (this.isInLive) {
      this.initSimRoboPos();
      await this.getLivePos();
    } else if (!this.isInLive) {
      await this.getLivePos();
      this.projectService.setInLive(true);
      this.isInLive = true;
    }
  }

  updateUI() {
    // Example of adding a simple fade-in/out effect to a specific element
    const modeElement = document.querySelector('.mode-indicator');
    if (modeElement) {
      modeElement.classList.add('fade-out');
      setTimeout(() => {
        modeElement.classList.remove('fade-out');
        modeElement.classList.add('fade-in');
      }, 300); // Adjust timing for the effect
    }
    // Example of updating a dynamic title based on mode
    const titleElement = document.querySelector('.mode-title');
    if (titleElement) {
      titleElement.textContent = this.isFleet
        ? 'Fleet Mode Active'
        : 'Simulation Mode Active';
    }
  }

  ngAfterViewInit(): void {
    if (this.myCanvas) {
      const canvas = this.myCanvas.nativeElement;
      this.addMouseMoveListener(canvas);
      this.addMouseClickListener(canvas);
      this.addMouseDownListener(canvas);
      this.addMouseUpListener(canvas);
      this.addRightClickListener(canvas);
    } else {
      console.error('myCanvas is undefined');
    }

    this.assetImages = {
      docking: new Image(),
      charging: new Image(),
    };

    this.assetImages['docking'].src = 'assets/Asseticon/docking-station.svg';
    this.assetImages['charging'].src = 'assets/Asseticon/charging-station.svg';
  }

  isStateDivVisible: boolean = false;

  toggleStateDiv(): void {
    this.isStateDivVisible = !this.isStateDivVisible;
  }

  // yet to update pos and save it in map..
  initSimRoboPos() {
    const imgWidth = this.mapImg.width; // Image width
    const imgHeight = this.mapImg.height; // Image height

    // Calculate the center position of the image
    let centerX = imgWidth / 2 + 620;
    let centerY = imgHeight / 2 + 250;

    let i = 0;
    if (!this.isFleet)
      this.simMode = this.simMode.map((robo) => {
        // Position each robot centered horizontally and vertically, with an offset for spacing
        robo.pos = {
          x: centerX - this.placeOffset * i,
          y: centerY,
          orientation: 0,
        };
        i++;
        return robo;
      });
  }

  showPopup(x: number, y: number) {
    const popup = document.getElementById('robo-popup') as HTMLDivElement;
    if (popup) {
      popup.style.display = 'block';
      popup.style.left = `${x}px`;
      popup.style.top = `${y}px`;
    }
  }

  hidePopup() {
    const popup = document.getElementById('robo-popup') as HTMLDivElement;
    if (popup) {
      popup.style.display = 'none';
    }
  }

  disableAllRobos() {
    this.simMode = this.simMode.map((robo) => {
      robo.isActive = false;
      return robo;
    });
  }

  async initializeWhileInLive(canvas: HTMLCanvasElement, event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const transY = this.mapImageHeight - mouseY;

    this.zoomLevel = this.nodeGraphService.getZoomLevel();
    const imgX = (mouseX - this.mapImageX) / this.zoomLevel;
    const imgY = (mouseY - this.mapImageY) / this.zoomLevel;

    for (let robo of this.simMode) {
      const roboX = robo.pos.x;
      const roboY = robo.pos.y;
      const imageSize = 25; // Adjust size based on robot image dimensions
      if (
        imgX >= roboX - imageSize &&
        imgX <= roboX + imageSize &&
        imgY >= roboY - imageSize &&
        imgY <= roboY + imageSize
      ) {
        // // Show the popup at the clicked position
        // this.showPopup(event.clientX, event.clientY);
        this.updatedrobo = robo;
        this.updatedrobo.isInitialized = false;
        await this.initializeRobo();
        return;
      }
    }
  }

  async initializeRobo() {
    if (this.updatedrobo) {
      // If the robot is already initialized, release it
      if (this.updatedrobo.isInitialized) {
        this.updatedrobo.isInitialized = false;
        console.log(`Robot ${this.updatedrobo.amrId} released`);
        this.hidePopup();
        return;
      } else {
        // Otherwise, initialize the robot
        this.updatedrobo.isInitialized = true;
        console.log(
          `Robot ${this.updatedrobo.amrId} initialized`,
          this.updatedrobo
        );
      }
    }

    this.robotToInitialize = JSON.parse(JSON.stringify(this.updatedrobo));
    this.hidePopup();
    await this.initializeRobot();
  }

  async initializeRobot(): Promise<void> {
    // console.log(this.robotToInitialize, this.ratio);
    let mapImg = new Image();
    mapImg.src = `http://${environment.API_URL}:${environment.PORT}/${
      this.projectService.getMapData().imgUrl
    }`;

    let ratio = this.ratio ? this.ratio : 1;
    let quaternion = { x: 0, y: 0, z: 0, w: 1 };
    const transformedY = mapImg.height - this.robotToInitialize.pos.y;
    this.robotToInitialize.pos.x =
      this.robotToInitialize.pos.x * ratio - this.origin.x;
    this.robotToInitialize.pos.y = transformedY * ratio - this.origin.y;

    // quaternion = this.positionToQuaternion(this.robotToInitialize.pos);
    let initializeRobo = {
      id: this.robotToInitialize.amrId,
      pose: {
        position: {
          x: this.robotToInitialize.pos.x,
          y: this.robotToInitialize.pos.y,
          z: this.robotToInitialize.pos.orientation,
        },
        orientation: quaternion,
      },
    };

    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/stream-data/initialize-robot`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapId: this.selectedMap.id,
          initializeRobo: initializeRobo,
        }),
      }
    );
    let data = await response.json();
    console.log(data);
    // this.cancelDelete();
    if (data.isInitialized) {
      // alert('robo Initialized!');
      this.messageService.add({
        severity: 'info',
        summary: 'robo Initialized!',
        detail: 'Robot',
        life: 4000,
      });
      return;
    }
    if (data.msg) {
      this.messageService.add({
        severity: 'error',
        summary: data.msg,
        life: 2000,
      });
    }
  }

  toggleShowPath() {
    this.isShowPath = !this.isShowPath;
    this.nodeGraphService.setIsShowPath(this.isShowPath);
  }

  toggleShowRoboPath() {
    this.hidePopup();
    // console.log(this.roboPathIds.size);

    if (this.roboPathIds.has(this.updatedrobo.amrId)) {
      this.roboPathIds.delete(this.updatedrobo.amrId);
      return;
    }
    this.roboPathIds.add(this.updatedrobo.amrId);
    this.isShowRoboPath = !this.isShowRoboPath;
    this.nodeGraphService.setIsShowRoboPath(this.roboPathIds.size);
  }

  showRoboPath() {
    // if (!this.updatedrobo || !this.paths) return;

    const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // const roboId = this.updatedrobo.amrId;

    for (let roboId of Array.from(this.roboPathIds)) {
      const path = this.paths.get(roboId);
      if (path) {
        const clr = this.roboIDColor.get(roboId) || 'black';
        // Draw the robot's path
        path.forEach((node) => {
          this.drawPathNode(ctx, node.x, node.y, clr);
        });
        for (let i = 0; i < path.length - 1; i++) {
          if (path[i + 1]) {
            this.drawPathLine(
              ctx,
              { x: path[i].x, y: path[i].y },
              { x: path[i + 1].x, y: path[i + 1].y },
              clr
            );
          }
        }
      }
    }
  }

  showPath() {
    const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    let keyItr = this.paths.keys();
    for (let roboId of keyItr) {
      let path = this.paths.get(roboId);
      if (path) {
        let clr = this.roboIDColor.get(roboId) || 'black';
        path.forEach((path) => {
          if (ctx) this.drawPathNode(ctx, path.x, path.y, clr);
        });
        for (let i = 0; i < path.length - 1; i += 1) {
          if (ctx && path[i + 1])
            this.drawPathLine(
              ctx,
              { x: path[i].x, y: path[i].y },
              { x: path[i + 1].x, y: path[i + 1].y },
              clr
            );
        }
      }
    }
  }

  cancelAction() {
    this.hidePopup();
  }

  enableMove() {
    this.hidePopup(); // Hide the popup after enabling move mode
  }

  async updateEditedMap() {
    if (!this.selectedMap) return;

    let editedMap = {
      simMode: this.simMode,
    };
    try {
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
      const { updatedData } = data;
      this.simMode = updatedData.simMode;
    } catch (error) {
      console.error('Error updating map:', error);
    }
  }
  async toggleAssignTask() {
    this.nodeGraphService.setShowModelCanvas(false);
    this.nodeGraphService.setAssignTask(!this.nodeGraphService.getAssignTask());
    if (this.isInLive) {
      await this.getLivePos();
    }
    if (this.nodeGraphService.getAssignTask()) {
      this.messageService.add({
        severity: 'info',
        summary: 'Enabled Task Assigning',
        detail: 'Task Assigning Option has been Enabled',
        life: 2000,
      });
    }

    this.loadCanvas(); // Redraw the canvas based on the updated state
    if (!this.isFleet) {
      this.currentRoboList = this.simMode.map((robo) => robo.amrId);
      return;
    }
    this.currentRoboList = this.robos.map((robo) => robo.roboDet.amrid);
  }
  async toggleModelCanvas() {
    this.nodeGraphService.setAssignTask(false);
    this.nodeGraphService.setShowModelCanvas(
      !this.nodeGraphService.getShowModelCanvas()
    );
    if (this.isInLive) {
      // this.initSimRoboPos();
      await this.getLivePos();
    }

    if (this.nodeGraphService.getShowModelCanvas()) {
      // this.showModelCanvas use instead..
      this.messageService.add({
        severity: 'info',
        summary: 'Map options',
        detail: 'Map options are now visible',
        life: 2000,
      });
    }

    this.loadCanvas(); // Redraw the canvas based on the updated state
  }

  redrawCanvas() {
    if (this.projectService.getInitializeMapSelected() == 'true') {
      const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Load the background image
        this.isImage = true;
        const img = new Image();
        img.src = `http://${environment.API_URL}:${environment.PORT}/${
          this.projectService.getMapData().imgUrl
        }`;

        img.onload = () => {
          // Draw the image and other elements
          this.draw(ctx, img);
        };
      }
    }
  }

  loadCanvas() {
    if (this.projectService.getInitializeMapSelected() == 'true') {
      const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        const img = new Image();
        let imgName = this.projectService.getMapData();
        img.src = `http://${environment.API_URL}:${environment.PORT}/${imgName.imgUrl}`;

        img.onload = () => {
          // Set canvas dimensions based on its container
          canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
          canvas.height =
            canvas.parentElement?.clientHeight || window.innerHeight;
          this.zoomLevel = this.nodeGraphService.getZoomLevel();

          // Calculate the scaled image dimensions
          this.mapImageWidth = img.width * this.zoomLevel;
          this.mapImageHeight = img.height * this.zoomLevel;
          this.offsetX = this.nodeGraphService.getOffsetX();
          this.offsetY = this.nodeGraphService.getOffsetY();

          // Center the image on the canvas
          this.mapImageX =
            (canvas.width - this.mapImageWidth) / 2 + this.offsetX;
          this.mapImageY =
            (canvas.height - this.mapImageHeight) / 2 + this.offsetY;

          // Draw the image and other elements
          this.draw(ctx, img);
        };
      }
    }
  }

  heatmapX: number = 0;
  heatmapY: number = 0;
  heatmapWidth: number = 0;
  heatmapHeight: number = 0;

  draw(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
    const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const imgWidth = img.width * this.zoomLevel;
    const imgHeight = img.height * this.zoomLevel;

    // Calculate the position to center the image
    const centerX = (canvas.width - imgWidth) / 2 + this.offsetX;
    const centerY = (canvas.height - imgHeight) / 2 + this.offsetY;
    // Apply transformation for panning and zooming
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(this.zoomLevel, this.zoomLevel);
    this.heatmapX = centerX;
    this.heatmapY = centerY;
    this.heatmapWidth = imgWidth;
    this.heatmapHeight = imgHeight;

    ctx.drawImage(img, 0, 0);
    this.canvasNoImage = false;
    this.canvasloader = false;

    if (!this.isFleet) {
      this.simMode.forEach((robo) => {
        // const transformedY = img.height - robo.pos.y;
        // console.log(!this.isFleet,"sim mode")
        let clr = this.roboIDColor.get(robo.amrId) || 'white';
        this.plotRobo(
          ctx,
          robo.pos.x,
          robo.pos.y,
          robo.pos.orientation,
          robo.imgState,
          clr
        );
      });
    }

    if (this.isFleet) {
      this.robos.forEach((robo) =>
        this.plotRobo(
          ctx,
          robo.pos.x,
          robo.pos.y,
          robo.roboDet.selected,
          robo.state,
          'black'
        )
      );
    }

    this.racks.forEach((rack) => {
      const robotPosX = rack.x;
      const robotPosY = rack.y;
      // const yaw = Math.round(Math.random()*360);
      this.plotRack(
        ctx,
        robotPosX - this.rackSize / 2,
        robotPosY - this.rackSize / 2,
        this.rackSize,
        0
      );
    });

    if (this.nodeGraphService.getAssignTask()) {
      this.nodes.forEach((node) => {
        const transformedY = img.height - node.nodePosition.y;
        this.drawNode(ctx, node.nodePosition.x, transformedY, node.nodeId);
      });
      ctx.restore();
      // return;
    }
    if (!this.nodeGraphService.getShowModelCanvas()) {
      ctx.restore();
      return;
    }
    this.nodes.forEach((node) => {
      const transformedY = img.height - node.nodePosition.y;
      this.drawNode(ctx, node.nodePosition.x, transformedY, node.nodeId);
    });

    this.edges.forEach((edge) => {
      const startNode = this.nodes.find((n) => n.nodeId === edge.startNodeId);
      const endNode = this.nodes.find((n) => n.nodeId === edge.endNodeId);
      if (startNode && endNode) {
        const startPos = {
          x: startNode.nodePosition.x,
          y: startNode.nodePosition.y,
        };
        const endPos = { x: endNode.nodePosition.x, y: endNode.nodePosition.y };
        const transformedStartY = img.height - startPos.y;
        const transformedEndY = img.height - endPos.y;
        this.drawEdge(
          ctx,
          { x: startPos.x, y: transformedStartY },
          { x: endPos.x, y: transformedEndY },
          edge.direction,
          edge.startNodeId,
          edge.endNodeId
        );
      }
    });

    this.zones.forEach((zone) => {
      this.plottedPoints = zone.pos;
      this.zoneType = zone.type;
      this.drawLayer(ctx);
      this.plottedPoints = [];
    });

    this.assets.forEach((asset) =>
      this.plotAsset(ctx, asset.x, asset.y, asset.type)
    );

    if (!this.isFleet) {
      this.simMode.forEach((robo) => {
        // console.log(!this.isFleet, 'sim mode');
        // const transformedY = img.height - robo.pos.y;
        let clr = this.roboIDColor.get(robo.amrId) || 'white';
        this.plotRobo(
          ctx,
          robo.pos.x,
          robo.pos.y,
          robo.pos.orientation,
          robo.imgState,
          clr
        );
      });
    }

    if (this.isFleet) {
      this.robos.forEach((robo) =>
        this.plotRobo(
          ctx,
          robo.pos.x,
          robo.pos.y,
          robo.roboDet.selected,
          robo.imgState,
          'black'
        )
      );
    }
    ctx.restore(); // Reset transformation after drawing
  }

  isRobotClicked(robo: any, x: number, y: number): boolean {
    const imageSize = 25;
    const roboX = robo.pos.x;
    const roboY = this.mapImageHeight - robo.pos.y;

    console.log(roboX, roboY);

    // Check if the click is within the robot's bounds (circle radius check)
    const distance = Math.sqrt((x - roboX) ** 2 + (y - roboY) ** 2);
    // console.log(distance, imageSize*1.5);
    return distance <= imageSize * 1.5; // Adjust this based on the robot's size
  }
  showATPopup(x: number, y: number) {
    const popup = document.getElementById('assignTask-popup');
    if (popup) {
      popup.style.display = 'block';
      popup.style.left = `${x}px`;
      popup.style.top = `${y}px`;
    }
  }
  async sendAction() {
    if (!this.taskAction || !this.roboToAssign || !this.sourceLocation ) {
      this.messageService.add({
        severity: 'error',
        summary: `Data not sent`,
        detail: 'data not sufficient!',
        life: 4000,
      });
      return;
    }
    // Handle default robo assignment
    const DEFAULT_AGENT_ID = '-99';
    this.roboToAssign = this.roboToAssign === 'Default' ? DEFAULT_AGENT_ID : this.roboToAssign;
    const genId = Date.now().toString(16);

    let taskData = {
      taskId: 't' + genId,
      agentId: this.roboToAssign,
      Priority: 1,
      sourceLocation: this.sourceLocation,
      taskType: this.taskAction,
    };

    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/stream-data/send-task/${this.selectedMap.id}`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      }
    );

    let data = await response.json();
    this.hideATPopup();
    this.messageService.add({
      severity: 'info',
      summary: `${data.msg}`,
      detail: 'Task has been assigned',
      life: 4000,
    });
  }

  cancelATAction() {
    this.roboToAssign = 'Select'; // Reset the dropdown to default value
    this.taskAction = 'MOVE';
    this.hideATPopup();
  }

  hideATPopup() {
    const popup = document.getElementById('assignTask-popup');
    if (popup) {
      popup.style.display = 'none';
    }
  }
  
  addRightClickListener(canvas: HTMLCanvasElement) {
    canvas.addEventListener('contextmenu', (event) => {
      event.preventDefault(); // Prevent the default context menu
      const assignTask = this.nodeGraphService.getAssignTask();
      this.offsetX = this.nodeGraphService.getOffsetX();
      this.offsetY = this.nodeGraphService.getOffsetY();
      this.zoomLevel = this.nodeGraphService.getZoomLevel();
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const transY = canvas.height - mouseY;
      const imgX = ((mouseX - this.mapImageX + this.offsetX) - this.offsetX)/ this.zoomLevel;
      const imgY = ((transY - this.mapImageY + this.offsetY)+ this.offsetY) / this.zoomLevel;

      for (let robo of this.simMode) {
        const roboX = robo.pos.x;
        const roboY = this.mapImageHeight / this.zoomLevel - robo.pos.y;
        const imageSize = 25; // Adjust size based on robot image dimensions
        if (
          imgX >= roboX - imageSize &&
          imgX <= roboX + imageSize &&
          imgY >= roboY - imageSize &&
          imgY <= roboY + imageSize
        ) {
          // Show the popup at the clicked position
          this.showPopup(event.clientX, event.clientY);
          this.updatedrobo = robo;
          return;
        }
      }
    });
  }
  addMouseDownListener(canvas: HTMLCanvasElement) {
    canvas.addEventListener('mousedown', (event) => {
      if (event.button === 2) {
        return;
      }
  
      const assignTask = this.nodeGraphService.getAssignTask();
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const transY = canvas.height - mouseY;
      this.offsetX = this.nodeGraphService.getOffsetX();
      this.offsetY = this.nodeGraphService.getOffsetY();
      this.zoomLevel = this.nodeGraphService.getZoomLevel();
      // Adjust for zoom and pan
      // const imgX =
      //   (mouseX - this.mapImageX + this.offsetX) / this.zoomLevel -
      //   this.offsetX;
      // const imgY =
      //   (transY - this.mapImageY + this.offsetY) / this.zoomLevel +
      //   this.offsetY;
      const imgX = ((mouseX - this.mapImageX + this.offsetX) - this.offsetX)/ this.zoomLevel;
      const imgY = ((transY - this.mapImageY + this.offsetY)+ this.offsetY) / this.zoomLevel;
      if (assignTask) {
        for (let node of this.nodes) {
          const nodeX = node.nodePosition.x;
          const nodeY = node.nodePosition.y;
          const nodeRadius = 15; // Define a radius to detect clicks near the node (adjust as needed)
          console.log('offset', this.offsetX, this.offsetY);
          console.log('nodepos', nodeX, nodeY);
          console.log('mousepos', imgX, imgY);

          if (
            imgX >= nodeX - nodeRadius &&
            imgX <= nodeX + nodeRadius &&
            imgY >= nodeY - nodeRadius &&
            imgY <= nodeY + nodeRadius
          ) {
            this.showATPopup(event.clientX, event.clientY);
            this.sourceLocation = node.nodeId;
            return;
          }
        }
      }
      for (let robo of this.simMode) {
        // console.log(this.zoomLevel);
        const roboX = robo.pos.x;
        const roboY = this.mapImageHeight / this.zoomLevel - robo.pos.y;
        const imageSize = 25; // Adjust to the sie of the robot image

        if (
          imgX >= roboX - imageSize &&
          imgX <= roboX + imageSize &&
          imgY >= roboY - imageSize &&
          imgY <= roboY + imageSize
        ) {
          // if (this.isRobotClicked(robo, imgX, imgY)) {
          if (robo.isInitialized) {
            console.log(`Robot ${robo.amrId} is initialized and cannot move.`);
            return; // Do not allow dragging if the robot is initialized
          }
          this.draggingRobo = robo; // Store the robot being dragged
          this.nodeGraphService.setDraggingRobo(robo);
          this.isDragging = true;
          this.hidePopup();
          break;
        }
      }
    });
  }

  addMouseUpListener(canvas: HTMLCanvasElement) {
    canvas.addEventListener('mouseup', async (event) => {
      this.draggingRobo = this.nodeGraphService.getDraggingRobo();
      if (this.draggingRobo && this.isInLive && !event.button) {
        // event.button ( look at it..! )
        await this.initializeWhileInLive(canvas, event);
      }
      if (this.isDragging) {
        this.isDragging = false;
        this.draggingRobo = null;
        this.nodeGraphService.setDraggingRobo(null);
        this.redrawCanvas();
      }
    });
  }
  applySpacing = true;
  addMouseClickListener(canvas: HTMLCanvasElement) {
    canvas.addEventListener('click', (event) => {
      // if (!this.showModelCanvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const transY = canvas.height - mouseY;
      this.offsetX = this.nodeGraphService.getOffsetX();
      this.offsetY = this.nodeGraphService.getOffsetY();
      this.zoomLevel = this.nodeGraphService.getZoomLevel();
      // console.log(this.zoomLevel);

      // Adjust for zoom and pan
      const imgX = (mouseX - this.mapImageX + this.offsetX) / this.zoomLevel;
      const imgY = (transY - this.mapImageY + this.offsetY) / this.zoomLevel;

      // Check if the click is within the bounds of the map image
      const isInsideMap =
        imgX >= 0 &&
        imgX <= this.mapImageWidth / this.zoomLevel &&
        imgY >= 0 &&
        imgY <= this.mapImageHeight / this.zoomLevel;

      if (!isInsideMap) {
        return; // Exit if the click is outside the map image
      }
      if (!this.isFleet)
        // Check if the click is on any robot within the map image
        for (let robo of this.robos) {
          const roboX = robo.pos.x;
          const roboY = this.mapImageHeight - robo.pos.y;
          console.log('robo pos:', roboX * this.ratio, roboY * this.ratio);

          // Assuming the robot image is a square, check if the click is within the image bounds
          const imageSize = 25; // Adjust this to the size of the robot image

          if (
            imgX >= roboX - imageSize &&
            imgX <= roboX + imageSize &&
            imgY >= roboY - imageSize &&
            imgY <= roboY + imageSize
          ) {
            // Set applySpacing to false when a robot is clicked
            this.applySpacing = false;
            // console.log(`Robot clicked: ${robo.roboDet.id}`);

            break;
          } else {
            // console.log('not_clicked');
          }
        }
    });
  }

  addMouseMoveListener(canvas: HTMLCanvasElement) {
    const tooltip = document.getElementById('Pos_tooltip')!;
    const robottooltip = document.getElementById('roboTooltip')!;
    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const transY = canvas.height - mouseY;
      this.offsetX = this.nodeGraphService.getOffsetX();
      this.offsetY = this.nodeGraphService.getOffsetY();
      this.zoomLevel = this.nodeGraphService.getZoomLevel();
      // Adjust for zoom and pan
      const imgX = ((mouseX - this.mapImageX + this.offsetX) - this.offsetX)/ this.zoomLevel;
      const imgY = ((transY - this.mapImageY + this.offsetY)+ this.offsetY) / this.zoomLevel;
      this.draggingRobo = this.nodeGraphService.getDraggingRobo();
      if (
        this.draggingRobo &&
        this.isDragging &&
        !this.draggingRobo.isInitialized
      ) {
        // this.draggingRobo.pos.x = this.draggingRobo.pos.x;
        // this.draggingRobo.pos.y = (this.mapImageHeight/ this.zoomLevel ) - this.draggingRobo.pos.y;
        let newX = (mouseX - this.mapImageX) / this.zoomLevel;
        let newY = (mouseY - this.mapImageY) / this.zoomLevel;
        // Update the position of the robot being dragged
        newX = Math.max(0, Math.min(newX, this.mapImageWidth / this.zoomLevel));
        newY = Math.max(
          0,
          Math.min(newY, this.mapImageHeight / this.zoomLevel)
        );

        // console.log("mouseXY",newX, newY);
        // Update the robot's position
        this.draggingRobo.pos.x = newX;
        this.draggingRobo.pos.y = newY;

        this.nodeGraphService.setDraggingRobo(this.draggingRobo);
        // Redraw the canvas with the updated robot position
        this.redrawCanvas();
      }
      let isOverRobot = false;
      let robotId = null;
      if (!this.isFleet) {
        for (let robo of this.simMode) {
          const roboX = robo.pos.x;
          const roboY = this.mapImageHeight / this.zoomLevel - robo.pos.y;
          const imageSize = 25; // Adjust to the size of the robot image

          if (
            imgX >= roboX - imageSize &&
            imgX <= roboX + imageSize &&
            imgY >= roboY - imageSize &&
            imgY <= roboY + imageSize
          ) {
            isOverRobot = true;
            robotId = robo.amrId;

            // Position the robot tooltip above the robot
            const robotScreenX =
              roboX * this.zoomLevel + this.mapImageX + this.zoomLevel; // X position on the canvas
            const robotScreenY =
              (this.mapImageHeight / this.zoomLevel - this.offsetY - roboY) * this.zoomLevel + this.offsetY + this.mapImageY; // Y position on the canvas

            robottooltip.style.left = `${robotScreenX - 30}px`; // Slightly to the left of the robot's X position
            robottooltip.style.top = `${robotScreenY - 45}px`; // Above the robot's Y position
            robottooltip.innerHTML = `Robot ID: ${robotId}`;
            robottooltip.style.display = 'block';
            break; // Exit the loop after finding the first robot
          }
        }
      }
      if (this.isFleet) {
        for (let robo of this.robos) {
          const roboX = robo.pos.x;
          const roboY = this.mapImageHeight / this.zoomLevel - robo.pos.y;
          const imageSize = 25; // Adjust to the size of the robot image

          if (
            imgX >= roboX - imageSize &&
            imgX <= roboX + imageSize &&
            imgY >= roboY - imageSize &&
            imgY <= roboY + imageSize
          ) {
            isOverRobot = true;
            robotId = robo.roboDet.id;

            // Position the robot tooltip above the robot
            const robotScreenX = roboX * this.zoomLevel + this.mapImageX; // X position on the canvas
            const robotScreenY =
              (this.mapImageHeight / this.zoomLevel - roboY) * this.zoomLevel +
              this.mapImageY; // Y position on the canvas

            robottooltip.style.left = `${robotScreenX - 30}px`; // Slightly to the left of the robot's X position
            robottooltip.style.top = `${robotScreenY - 45}px`; // Above the robot's Y position
            robottooltip.innerHTML = `Robot ID: ${robotId}`;
            robottooltip.style.display = 'block';
            break; // Exit the loop after finding the first robot
          }
        }
      }
      if (!isOverRobot || robotId === null) {
        robottooltip.style.display = 'none'; // Hide tooltip when not over a robot
      }
      const isInsideMap =
        imgX >= 0 &&
        imgX <= this.mapImageWidth / this.zoomLevel &&
        imgY >= 0 &&
        imgY <= this.mapImageHeight / this.zoomLevel;
      if (isInsideMap) {
        const formattedX = ((imgX * this.ratio) - this.origin.x).toFixed(2);
        const formattedY = ((imgY * this.ratio) - this.origin.y).toFixed(2);
        //Set tooltip content and position
        tooltip.textContent = `X = ${formattedX}, Y = ${formattedY}`;
        tooltip.style.display = 'block';
        tooltip.style.left = `${event.clientX}`;
        tooltip.style.top = `${event.clientY}`; // Adjust 10px below the cursor
      } else {
        tooltip.style.display = 'none'; // Hide the tooltip when not over a robot
      }
    });

    canvas.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  }

  // List of robots
  robots = [
    { name: 'Robot 1', enabled: false },
    { name: 'Robot 2', enabled: false },
    { name: 'Robot 3', enabled: false },
  ];

  // Toggle the dropdown menu
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    // this.liveRobos = // yet to look at it..
  }

  async enable_robot(robot: any) {
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/stream-data/enable-robot`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapId: this.selectedMap.id,
          roboToEnable: {
            robotId: robot.amrId,
            enable: true,
          },
        }),
      }
    );
    return await response.json();
  }

  async activateRobot(robot: any) {
    let fleetUp = this.projectService.getIsFleetUp();
    if (!fleetUp) return;

    robot.enabled = true;
    let data = await this.enable_robot(robot);

    this.simMode = this.simMode.map((robo) => {
      if (robo.amrId === robot.amrId && data.isRoboEnabled) {
        robo.isActive = true;
      } else if (robo.amrId === robot.amrId && !data.isRoboEnabled) {
        robo.isActive = false;
      }
      return robo;
    });

    if (data.isRoboEnabled) {
      this.messageService.add({
        severity: 'info',
        summary: `${
          robot.roboName || robot.roboDet.roboName
        } has been enabled.`,
        detail: 'Robot has been Enabled',
        life: 4000,
      });
      await this.showSpline(robot.amrId);
    } else {
      this.messageService.add({
        severity: 'error',
        summary: `${
          robot.roboName || robot.roboDet.roboName
        } has not been enabled.`,
        detail: 'The robot is not initialized, so it cannot be Enabled',
        life: 4000,
      });
    }
    console.log(`${robot.roboName} has been enabled.`);
  }

  async getMapDetails() {
    let mapData = this.projectService.getMapData();
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${mapData.mapName}`
    );
    if (!response.ok)
      throw new Error(`Error with status code of ${response.status}`);
    let data = await response.json();
    if (!data.map) return;
    mapData = data.map;

    this.heatmapService.setHeatmap(mapData.heatMap);

    this.ratio = data.map.mpp;
    this.rackSize = 0.9 / this.ratio; // change to 0.9
    this.origin = {
      x: mapData.origin.x,
      y: mapData.origin.y,
      w: mapData.origin.w,
    };

    this.heatmapService.setOriginAndRatio(this.origin, this.ratio);
    this.nodes = mapData.nodes.map((node: any) => {
      // yet to interface in this component..
      node.nodePosition.x =
        (node.nodePosition.x + (this.origin.x || 0)) / (this.ratio || 1);
      node.nodePosition.y =
        (node.nodePosition.y + (this.origin.y || 0)) / (this.ratio || 1);
      return node;
    });

    this.nodeGraphService.setNodes(this.nodes); // in use..

    this.edges = mapData.edges;

    this.nodeGraphService.setEdges(this.edges); // in use..

    this.assets = mapData.stations.map((asset: any) => {
      asset.x = (asset.x + (this.origin.x || 0)) / (this.ratio || 1);
      asset.y = (asset.y + (this.origin.y || 0)) / (this.ratio || 1);
      return asset;
    });

    this.nodeGraphService.setAssets(this.assets);

    this.zones = mapData.zones.map((zone: any) => {
      zone.pos = zone.pos.map((pos: any) => {
        pos.x = (pos.x + (this.origin.x || 0)) / (this.ratio || 1);
        pos.y = (pos.y + (this.origin.y || 0)) / (this.ratio || 1);
        return pos;
      });
      return zone;
    });

    this.nodeGraphService.setZones(this.zones);

    this.robos = mapData.roboPos.map((robo: any) => {
      robo.pos.x = robo.pos.x / (this.ratio || 1);
      robo.pos.y = robo.pos.y / (this.ratio || 1);

      return robo;
    });

    // yet to check..
    // if(!this.isInLive)
    this.simMode = mapData.simMode.map((robo: any) => {
      robo.pos.x = robo.pos.x / (this.ratio || 1);
      robo.pos.y = robo.pos.y / (this.ratio || 1);

      return robo;
    });
    this.updateRoboClrs(); // temp. right ig
    this.nodeGraphService.setsimMode(this.simMode);

    this.mapImg = new Image();
    let imgName = this.projectService.getMapData();
    this.mapImg.src = `http://${environment.API_URL}:${environment.PORT}/${imgName.imgUrl}`;
  }

  async fetchRoboPos(x: number, y: number, yaw: number) {
    // console.log(amrPos);
    const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    const imageWidth = 35; // Set this to the actual width of the plotted image
    const imageHeight = 25; // Set this to the actual height of the plotted image

    const mapImage = new Image();
    let map = this.projectService.getMapData();
    mapImage.src = `http://${environment.API_URL}:${environment.PORT}/${map.imgUrl}`;
    await mapImage.decode(); // Wait for the image to load

    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.offsetX = this.nodeGraphService.getOffsetX();
      this.offsetY = this.nodeGraphService.getOffsetY();
      this.zoomLevel = this.nodeGraphService.getZoomLevel();
      // Calculate the scaled image dimensions
      const imgWidth = mapImage.width * this.zoomLevel;
      const imgHeight = mapImage.height * this.zoomLevel;

      // Center the image on the canvas
      const centerX = (canvas.width - imgWidth) / 2;
      const centerY = (canvas.height - imgHeight) / 2;
      // Apply transformation for panning and zooming
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(this.zoomLevel, this.zoomLevel);
      ctx.restore(); // Reset transformation after drawing

      if (
        this.nodeGraphService.getShowModelCanvas() ||
        !this.nodeGraphService.getAssignTask()
      ) {
        // this.showModelCanvas
        this.redrawOtherElements(ctx, mapImage); // Pass the mapImage for transformations
      }
      // Draw the map image
      ctx.drawImage(mapImage, 0, 0);

      // If showModelCanvas is true, draw additional elements
      // if (this.nodeGraphService.getShowModelCanvas()) { // yet to uncomment in case..
      //   // this.showModelCanvas
      //   this.redrawOtherElements(ctx, mapImage);
      // }
      // if (i > 0) clearPreviousImage(amrPos[i - 1].x, amrPos[i - 1].y);
      const transformedY = canvas.height - y;
      // console.log(amrPos[i].x, amrPos[i].y);
      this.plotRobo(ctx, x, transformedY, yaw, 'robot0', 'black');
    }
  }

  redrawOtherElements(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
    // // Redraw nodes, edges, assets, and zones
    this.nodes.forEach((node) => {
      const transformedY = img.height - node.nodePosition.y;
      this.drawNode(ctx, node.nodePosition.x, transformedY, node.nodeId);
    });

    // Draw edges between nodes
    this.edges.forEach((edge) => {
      const startNode = this.nodes.find((n) => n.nodeId === edge.startNodeId);
      const endNode = this.nodes.find((n) => n.nodeId === edge.endNodeId);
      if (startNode && endNode) {
        const startPos = {
          x: startNode.nodePosition.x,
          y: startNode.nodePosition.y,
        };
        const endPos = { x: endNode.nodePosition.x, y: endNode.nodePosition.y };
        const transformedStartY = img.height - startPos.y;
        const transformedEndY = img.height - endPos.y;
        this.drawEdge(
          ctx,
          { x: startPos.x, y: transformedStartY },
          { x: endPos.x, y: transformedEndY },
          edge.direction,
          edge.startNodeId,
          edge.endNodeId
        );
      }
    });

    this.zones.forEach((zone) => {
      this.plottedPoints = zone.pos;
      this.zoneType = zone.type;
      this.drawLayer(ctx);
      this.plottedPoints = [];
    });

    this.assets.forEach((asset) =>
      this.plotAsset(ctx, asset.x, asset.y, asset.type)
    );
  }

  async onInitMapImg() {
    let project = this.projectService.getSelectedProject();
    // console.log(project,'Project')
    let mapArr = [];

    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-project/${project._id}`,
      { credentials: 'include' }
    );
    if (!response.ok) {
      console.error('Error while fetching map data : ', response.status);
      return;
    }

    let data = await response.json();
    // console.log(data, 'oninit map');
    let projectSites = data.project.sites;

    mapArr = projectSites.flatMap((sites: any) => {
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
    });

    mapArr.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (!mapArr.length) return;

    const mapResponse = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${mapArr[0].mapName}`
    );
    let mapData = await mapResponse.json();

    this.projectService.setMapData({
      ...mapArr[0],
      imgUrl: mapData.map.imgUrl,
    });

    // Set the zoomLevel after fetching the map data
    const img = new Image();
    img.src = `http://${environment.API_URL}:${environment.PORT}/${mapData.map.imgUrl}`;

    // Ensure the zoom level is calculated after the image is loaded
    img.onload = () => {
      this.zoomLevel = img.width > 1355 || img.height > 664 ? 0.8 : 1.0;
      console.log(`Zoom level set to: ${this.zoomLevel}`);
    };

    this.loadCanvas();
  }

  quaternionToYaw(w: number, x: number, y: number, z: number): number {
    // Calculate the yaw (rotation around the Z-axis)
    const yaw = Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z));

    // Convert yaw from radians to degrees, if necessary
    const yawDegrees = yaw * (180 / Math.PI);

    return yawDegrees;
  }

  async getLivePos() {
    this.selectedMap = this.projectService.getMapData();
    if (!this.selectedMap) {
      console.log('no map selected');
      return;
    }
    const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    const URL = `http://${environment.API_URL}:${environment.PORT}/stream-data/live-AMR-pos/${this.selectedMap.id}`;
    const ASSET_URL = `http://${environment.API_URL}:${environment.PORT}/stream-data/live-assets/${this.selectedMap.id}`;

    if (this.posEventSource) this.posEventSource.close();
    if (this.assetEventSource) this.assetEventSource.close();

    this.posEventSource = new EventSource(URL);
    this.assetEventSource = new EventSource(ASSET_URL);

    this.posEventSource.onmessage = async (event) => {
      this.projectService.setInLive(true);
      this.isInLive = true;
      const robotsData: any = {};

      try {
        const data = JSON.parse(event.data);
        // console.log(data);

        const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');

        const mapImage = new Image();
        let map = this.projectService.getMapData();
        mapImage.src = `http://${environment.API_URL}:${environment.PORT}/${map.imgUrl}`;
        await mapImage.decode(); // Wait for the image to load

        if (!ctx) return;

        // Clear the whole canvas before redrawing the map and all robots
        this.zoomLevel = this.nodeGraphService.getZoomLevel();
        this.offsetX = this.nodeGraphService.getOffsetX();
        this.offsetY = this.nodeGraphService.getOffsetY();

        // Loop through each robot to update their pose and position
        if (data.robots?.length) {
          data.robots.forEach(async (robot: any) => {
            let posX =
              (robot.pose.position.x + (this.origin.x || 0)) /
              (this.ratio || 1);
            let posY =
              (robot.pose.position.y + (this.origin.y || 0)) /
              (this.ratio || 1);

            let yaw = this.quaternionToYaw(
              robot.pose.orientation.w,
              robot.pose.orientation.x,
              robot.pose.orientation.y,
              robot.pose.orientation.z
            );

            // use Number constructor or (+) unary operator to perform with single operand
            this.heatmapService.accumulateCoors({
              x: Number(robot.pose.position.x?.toFixed(0)),
              y: Number(robot.pose.position.y?.toFixed(0)),
            });

            // Store each robot's position and orientation using the robot ID
            robotsData[robot.id] = {
              posX,
              posY,
              yaw: yaw,
              state: robot.robot_state,
              path: robot.agentPath,
              payload: robot.payload_status,
            }; // here we go...

            // console.log(robot.id, robot.pose.position.x, robot.pose.position.y);
            this.simMode = this.nodeGraphService.getsimMode();
            this.roboIDColor = this.nodeGraphService.getRoboIdClr();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.plotAllRobots(robotsData, ctx, canvas, mapImage);
          });
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    this.assetEventSource.onmessage = async (event) => {
      this.projectService.setInLive(true);
      this.isInLive = true;

      try {
        const data = JSON.parse(event.data);

        const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');

        const mapImage = new Image();
        let map = this.projectService.getMapData();
        mapImage.src = `http://${environment.API_URL}:${environment.PORT}/${map.imgUrl}`;
        await mapImage.decode(); // Wait for the image to load

        if (!ctx) return;

        // Clear the whole canvas before redrawing the map and all robots
        this.zoomLevel = this.nodeGraphService.getZoomLevel();
        this.offsetX = this.nodeGraphService.getOffsetX();
        this.offsetY = this.nodeGraphService.getOffsetY();

        if (data.assets?.length)
          this.plotAllAssets(data.assets, ctx, canvas, mapImage);
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    this.posEventSource.onerror = (error) => {
      this.projectService.setInLive(false);
      this.isInLive = false;
      this.getOnBtnImage();
      this.posEventSource.close();
      console.error('SSE error:', error);
    };

    this.assetEventSource.onerror = (error) => {
      this.projectService.setInLive(false);
      this.isInLive = false;
      this.getOnBtnImage();
      this.assetEventSource.close();
      console.error('Asset SSE error:', error);
    };
  }

  stateColorMap: { [key: string]: string } = {
    INITSTATE: '#8f910d', // Dark yellow
    NORMALSTATE: '#eaed39',
    PAUSESTATE: '#ffa500',
    ERRORSTATE: '#ff0800',
    WAITSTATE: '#0b663c', // Dark green
    IDLESTATE: '#065baa',
    MOVESTATE: '#08ad66',
    DOCKSTATE: '#a3cfe8',
    UNDOCKSTATE: '#a3cfe8',
    LOADSTATE: '#f5adae',
    UNLOADSTATE: '#533621',
    CHARGESTATE: '#9900cc',
    FAILEDSTATE: '#ff0800',
  };

  roboIDColor = new Map<number, string>();

  plotRobo(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    orientation: number,
    state: string,
    circleColor: string
  ) {
    const width = 25 * this.zoomLevel * 1.3; // Define the width of the square
    const height = 25 * this.zoomLevel; // Define the height of the square
    const borderRadius = 3; // Border radius for the square
    const circleRadius = height / 3.5; // Circle radius
    const rectangleColor = this.stateColorMap[state] || '#ff7373';
    const borderColor = '#000000'; // Define the border color
    const borderThickness = 0.8; // Define the border thickness
    const triangleSize = circleRadius / 1.15; // Define the triangle size
  
    if (ctx) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((orientation * Math.PI) / 180);
  
      // Draw the rounded rectangle (manually if roundRect is unsupported)
      ctx.beginPath();
      ctx.moveTo(-width / 2 + borderRadius, -height / 2);
      ctx.lineTo(width / 2 - borderRadius, -height / 2);
      ctx.quadraticCurveTo(
        width / 2,
        -height / 2,
        width / 2,
        -height / 2 + borderRadius
      );
      ctx.lineTo(width / 2, height / 2 - borderRadius);
      ctx.quadraticCurveTo(
        width / 2,
        height / 2,
        width / 2 - borderRadius,
        height / 2
      );
      ctx.lineTo(-width / 2 + borderRadius, height / 2);
      ctx.quadraticCurveTo(
        -width / 2,
        height / 2,
        -width / 2,
        height / 2 - borderRadius
      );
      ctx.lineTo(-width / 2, -height / 2 + borderRadius);
      ctx.quadraticCurveTo(
        -width / 2,
        -height / 2,
        -width / 2 + borderRadius,
        -height / 2
      );
      ctx.closePath();
  
      ctx.fillStyle = rectangleColor; // Set the rectangle color
      ctx.fill();
      ctx.lineWidth = borderThickness;
      ctx.strokeStyle = borderColor;
      ctx.stroke();
  
      // Draw the circle inside the rounded rectangle
      ctx.beginPath();
      ctx.arc(0, 0, circleRadius, 0, Math.PI * 2); // Circle at the center
      ctx.fillStyle = circleColor; // Set the circle color
      ctx.fill();
      ctx.lineWidth = borderThickness - 0.2; // Set the circle border thickness
      ctx.strokeStyle = borderColor; // Set the circle border color
      ctx.stroke();
      ctx.closePath();
  
      // Draw the triangle pointing to the front
      ctx.beginPath();
      ctx.moveTo(-circleRadius - triangleSize, 0); // Left of the circle
      ctx.lineTo(-circleRadius, -triangleSize / 2); // Top corner
      ctx.lineTo(-circleRadius, triangleSize / 2); // Bottom corner
      ctx.closePath();
  
      ctx.fillStyle = circleColor; // Same color as the circle
      ctx.fill();
      ctx.lineWidth = borderThickness - 0.2; // Triangle border thickness
      ctx.strokeStyle = borderColor; // Triangle border color
      ctx.stroke();
  
      ctx.restore();
    }
  }
  

  isOptionsExpanded: boolean = false;

  toggleOptions() {
    this.isOptionsExpanded = !this.isOptionsExpanded;
    const canvasOptions = document.querySelector(
      '.CanvasOptions'
    ) as HTMLElement;

    if (this.isOptionsExpanded) {
      canvasOptions.style.width = '570px';
      canvasOptions.style.backgroundColor = 'rgb(255, 255, 255)';
      canvasOptions.style.boxShadow = '0 3px 6px #ff7373';
    } else {
      canvasOptions.style.width = '50px';
      canvasOptions.style.backgroundColor = '#fffcfc6c';
      canvasOptions.style.boxShadow = '0 3px 6px #ff7373';
    }
  }

  plotAllRobots(
    robotsData: any,
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    mapImage: HTMLImageElement
  ) {
    // Calculate the scaled image dimensions and center the image on the canvas
    const imgWidth = mapImage.width * this.zoomLevel;
    const imgHeight = mapImage.height * this.zoomLevel;

    const centerX = (canvas.width - imgWidth) / 2 + this.offsetX;
    const centerY = (canvas.height - imgHeight) / 2 + this.offsetY;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(this.zoomLevel, this.zoomLevel);
    ctx.drawImage(mapImage, 0, 0);
    ctx.restore(); // Reset transformation after drawing the map

    for (let [index, robotId] of Object.keys(robotsData).entries()) {
      const { posX, posY, yaw, state, path, payload } = robotsData[robotId];

      // Scale position and apply spacing offset
      const scaledPosX = posX;
      const scaledPosY = posY;

      // Flip Y-axis for canvas and calculate actual canvas positions
      const transformedPosY = !this.simMode
        ? this.mapImageHeight - scaledPosY // Non-simulation mode
        : imgHeight / this.zoomLevel - scaledPosY;
      const robotCanvasX = scaledPosX;
      const robotCanvasY = transformedPosY;
      this.setPaths(path, imgHeight, centerX, centerY, parseInt(robotId));

      if (
        this.nodeGraphService.getShowModelCanvas()
      ) {
        this.nodes = this.nodeGraphService.getNodes();
        this.edges = this.nodeGraphService.getEdges();
        this.zones = this.nodeGraphService.getZones();
        this.assets = this.nodeGraphService.getAssets();
        this.drawNodesAndEdges(ctx, mapImage, centerX, centerY, this.zoomLevel);
      }
      if(this.nodeGraphService.getAssignTask()){
        this.nodes = this.nodeGraphService.getNodes();
        this.drawnodesonAT(ctx, mapImage, centerX, centerY, this.zoomLevel);
      }
      if (this.isFleet) {
        this.robos = this.robos.map((robo) => {
          if (robo.roboDet.id === parseInt(robotId)) {
            robo.pos.x = robotCanvasX;
            robo.pos.y = robotCanvasY;
            robo.pos.orientation = -yaw;
            robo.imgState = state;
            robo.payload = payload;
          }
          return robo;
        });
      }

      this.simMode = this.simMode.map((robo) => {
        this.draggingRobo = this.nodeGraphService.getDraggingRobo();
        let draggingRoboId = this.draggingRobo ? this.draggingRobo.amrId : null;
        if (robo.amrId === parseInt(robotId) && robo.amrId !== draggingRoboId) {
          robo.pos.x = robotCanvasX;
          robo.pos.y = robotCanvasY;
          robo.pos.orientation = -yaw;
          robo.imgState = state;
          robo.payload = payload;
          if (state !== 'INITSTATE') {
            robo.isActive = true;
            // this.cdRef.detectChanges();//yet to review and remove
          }
        }
        return robo;
      });

      //..
      //..
    }

    if (this.nodeGraphService.getIsShowPath()) this.showPath();
    if (this.nodeGraphService.getIsShowRoboPath()) this.showRoboPath();
    // After updating positions, use the adjusted positions to draw the robots
    if (!this.isFleet)
      this.simMode.forEach((robo) => {
        const robotPosX = centerX + robo.pos.x * this.zoomLevel;
        const robotPosY = centerY + robo.pos.y * this.zoomLevel;
        const yaw = robo.pos.orientation;

        // Draw the robot on the canvas with updated positions and orientation
        let clr = this.roboIDColor.get(robo.amrId) || 'white';
        this.plotRobo(ctx, robotPosX, robotPosY, yaw, robo.imgState, clr);
        if (
          robo.imgState === 'LOADSTATE' ||
          robo.imgState === 'UNLOADSTATE' ||
          robo.payload
        ) {
          this.plotRack(
            ctx,
            robotPosX - (this.rackSize * this.zoomLevel) / 2,
            robotPosY - (this.rackSize * this.zoomLevel) / 2,
            this.rackSize * this.zoomLevel,
            yaw,
            '#7393B3'
          );
        }
      });

    if (this.isFleet)
      this.robos.forEach((robo) => {
        const robotPosX = centerX + robo.pos.x * this.zoomLevel;
        const robotPosY = centerY + robo.pos.y * this.zoomLevel;
        const yaw = robo.pos.orientation;

        // Draw the robot on the canvas with updated positions and orientation
        let clr = this.roboIDColor.get(robo.amrId) || 'white';
        this.plotRobo(ctx, robotPosX, robotPosY, yaw, robo.imgState, clr);
      });

    this.racks.forEach((rack) => {
      const robotPosX = centerX + rack.x * this.zoomLevel;
      const robotPosY = centerY + rack.y * this.zoomLevel;
      const yaw = rack.yaw;
      this.plotRack(
        ctx,
        robotPosX - (this.rackSize * this.zoomLevel) / 2,
        robotPosY - (this.rackSize * this.zoomLevel) / 2,
        this.rackSize * this.zoomLevel,
        yaw
      );
    });
  }

  plotAllAssets(
    assets: any,
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    mapImage: HTMLImageElement
  ) {
    const imgWidth = mapImage.width * this.zoomLevel;
    const imgHeight = mapImage.height * this.zoomLevel;

    const centerX = (canvas.width - imgWidth) / 2 + this.offsetX;
    const centerY = (canvas.height - imgHeight) / 2 + this.offsetY;

    // if (this.nodeGraphService.getShowModelCanvas()) {
    //   this.nodes = this.nodeGraphService.getNodes();
    //   this.edges = this.nodeGraphService.getEdges();
    //   this.zones = this.nodeGraphService.getZones();
    //   this.assets = this.nodeGraphService.getAssets();
    //   this.drawNodesAndEdges(ctx, mapImage, centerX, centerY, this.zoomLevel);
    // }

    this.racks = assets.map((rack: any) => {
      let posX = (rack.x + (this.origin.x || 0)) / (this.ratio || 1);
      let posY = (rack.y + (this.origin.y || 0)) / (this.ratio || 1);

      const scaledPosX = posX;
      const scaledPosY = posY;

      const transformedPosY = !this.simMode
        ? this.mapImageHeight - scaledPosY // Non-simulation mode
        : imgHeight / this.zoomLevel - scaledPosY;
      const robotCanvasX = scaledPosX;
      const robotCanvasY = transformedPosY;

      // let yaw = this.quaternionToYaw();
      return { x: robotCanvasX, y: robotCanvasY, yaw: -rack.yaw + 90 };
    });

    // this.racks.forEach((rack)=>{
    //   const robotPosX = centerX + rack.x * this.zoomLevel;
    //   const robotPosY = centerY + rack.y * this.zoomLevel;
    //   const yaw = rack.yaw;
    //   this.plotRack(ctx, robotPosX - (this.rackSize* this.zoomLevel/2), robotPosY - (this.rackSize* this.zoomLevel/2), this.rackSize* this.zoomLevel, yaw);
    // })
  }

  async setPaths(
    path: any[],
    imgHeight: number,
    centerX: number,
    centerY: number,
    robotId: number
  ) {
    let roboPath: any[] = [];

    if (!path) return;
    path.forEach((path: any) => {
      let pathX = (path.x + (this.origin.x || 0)) / (this.ratio || 1);
      let pathY = (path.y + (this.origin.y || 0)) / (this.ratio || 1);
      // Non-simulation mode
      const transformedPathY = !this.simMode
        ? this.mapImageHeight - pathX
        : imgHeight / this.zoomLevel - pathY;
      const pathCanvasX = pathX;
      const pathCanvasY = transformedPathY;
      roboPath.push({
        x: centerX + pathCanvasX * this.zoomLevel,
        y: centerY + pathCanvasY * this.zoomLevel,
      });
    });
    this.paths.set(robotId, roboPath);
  }

  plotRack(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number = this.rackSize,
    angle: number,
    color: string = '#7393B3'
  ) {
    ctx.save(); // Save the current context state

    // Translate to the center of the square
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    ctx.translate(centerX, centerY);

    // Rotate the canvas by the specified angle (converted to radians)
    ctx.rotate((angle * Math.PI) / 180);

    // Translate back to the top-left corner of the square
    ctx.translate(-centerX, -centerY);
    ctx.globalAlpha = 0.8;

    // Set the fill color for the square
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);

    ctx.fillStyle = '#420D09';
    ctx.fillRect(x, y, size, Math.round(size / 3) / 3);

    ctx.fillStyle = '#ff1f1f';
    ctx.fillRect(
      x,
      y + size - Math.round(size / 3 / 3),
      size,
      Math.round(size / 3) / 3
    );

    // Reset globalAlpha to 1 to avoid affecting subsequent drawings
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  drawnodesonAT(    
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    centerX: number,
    centerY: number,
    zoomLevel: number){
      
    this.offsetX = this.nodeGraphService.getOffsetX();
    this.offsetY = this.nodeGraphService.getOffsetY();
    this.zoomLevel = this.nodeGraphService.getZoomLevel();
    // Plot nodes with scaling and centering
    this.nodes.forEach((node) => {
      const scaledX = node.nodePosition.x * zoomLevel;
      const scaledY = (img.height - node.nodePosition.y) * zoomLevel; // Flip Y-axis and scale
      this.drawNode(ctx, centerX + scaledX, centerY + scaledY, node.nodeId);
    });
    }
  drawNodesAndEdges(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    centerX: number,
    centerY: number,
    zoomLevel: number
  ) {
    this.offsetX = this.nodeGraphService.getOffsetX();
    this.offsetY = this.nodeGraphService.getOffsetY();
    this.zoomLevel = this.nodeGraphService.getZoomLevel();
    // Plot nodes with scaling and centering
    this.nodes.forEach((node) => {
      const scaledX = node.nodePosition.x * zoomLevel;
      const scaledY = (img.height - node.nodePosition.y) * zoomLevel; // Flip Y-axis and scale
      this.drawNode(ctx, centerX + scaledX, centerY + scaledY, node.nodeId);
    });

    // Plot edges with scaling and centering
    this.edges.forEach((edge) => {
      const startNode = this.nodes.find((n) => n.nodeId === edge.startNodeId);
      const endNode = this.nodes.find((n) => n.nodeId === edge.endNodeId);

      if (startNode && endNode) {
        const startX = startNode.nodePosition.x * zoomLevel;
        const startY = (img.height - startNode.nodePosition.y) * zoomLevel;
        const endX = endNode.nodePosition.x * zoomLevel;
        const endY = (img.height - endNode.nodePosition.y) * zoomLevel;

        // Adjust for centering
        this.drawEdge(
          ctx,
          { x: centerX + startX, y: centerY + startY },
          { x: centerX + endX, y: centerY + endY },
          edge.direction,
          edge.startNodeId,
          edge.endNodeId
        );
      }
    });

    // Plot zones with scaling and centering
    this.zones.forEach((zone) => {
      // this.plottedPoints = zone.pos.map((point) => ({
      //     x: centerX + point.x * zoomLevel,
      //     y: centerY + (img.height - point.y) * zoomLevel, // Flip and scale
      // }));
      this.zoneType = zone.type;
      this.drawLayer(ctx); // Assuming `drawLayer` plots zone points
      this.plottedPoints = [];
    });

    // Plot assets with scaling and centering
    this.assets.forEach((asset) => {
      const assetX = asset.x * zoomLevel;
      const assetY = (img.height - asset.y) * zoomLevel;
      this.plotAsset(ctx, centerX + assetX, centerY + assetY, asset.type);
    });
  }

  async showSpline(roboId: number): Promise<boolean> {
    if (!this.selectedMap.id) return false;
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/stream-data/show-spline`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapId: this.selectedMap.id,
          roboId: roboId,
        }),
      }
    );
    let data = await response.json();

    return data.isShowSplined;
    // if (data.isShowSplined) this.getLivePos();
  }

  // start-stop the operation!
  startStopOpt() {
    // this.showSpline();
    if (this.isInLive) return;

    this.ONBtn = !this.ONBtn;
    this.getLivePos();
    if (this.UptimeComponent) this.UptimeComponent.getUptimeIfOn(); // call the uptime comp function
    if (this.throughputComponent) this.throughputComponent.getThroughPutIfOn();
  }

  getOnBtnImage(): string {
    return this.isInLive // this.ONVtm
      ? '../../assets/icons/on.svg'
      : '../../assets/icons/off.svg';
  }

  getliveAmrPos() {
    const URL = `http://${environment.API_URL}:${environment.PORT}/stream-data/live-AMR-pos`;
    if (this.eventSource) this.eventSource.close();

    this.eventSource = new EventSource(URL);
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(data);
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.eventSource.close();
    };
  }

  private plotAsset(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    assetType: string
  ): void {
    // const canvas = this.overlayCanvas.nativeElement;
    // const ctx = this.overlayCanvas.nativeElement.getContext('2d');
    const image = this.assetImages[assetType];

    if (image && ctx) {
      const imageSize = 50; // Set image size
      ctx.drawImage(
        image,
        x - imageSize / 2,
        y - imageSize / 2,
        imageSize,
        imageSize
      );
    }
  }

  drawLayer(ctx: CanvasRenderingContext2D): void {
    // const canvas = this.overlayCanvas.nativeElement;
    // const ctx = canvas.getContext('2d');
    if (ctx && this.plottedPoints.length >= 3 && this.zoneType) {
      ctx.beginPath();
      ctx.moveTo(this.plottedPoints[0].x, this.plottedPoints[0].y);

      // Draw lines between points to form a polygon
      for (let i = 1; i < this.plottedPoints.length; i++) {
        ctx.lineTo(this.plottedPoints[i].x, this.plottedPoints[i].y);
      }

      ctx.closePath();

      // Set the fill color based on the selected zone type
      const zoneColor = this.zoneColors[this.zoneType];
      ctx.fillStyle = zoneColor;
      ctx.fill();
      this.plottedPoints = [];
    } else {
      console.error('Insufficient points or zone type not selected');
    }
  }

  private drawEdge(
    ctx: CanvasRenderingContext2D,
    startPos: { x: number; y: number },
    endPos: { x: number; y: number },
    direction: string,
    nodeRadius: number = 10,
    threshold: number = 5
  ): void {
    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const startX = startPos.x + dx / distance;
    const startY = startPos.y + dy / distance;
    const endX = endPos.x - dx / distance;
    const endY = endPos.y - dy / distance;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);

    if (direction === 'UN_DIRECTIONAL') {
      ctx.strokeStyle = 'black'; // Uni-directional in black
    } else if (direction === 'BI_DIRECTIONAL') {
      ctx.strokeStyle = 'green'; // Bi-directional in green
    }
    ctx.lineWidth = 1;
    ctx.stroke();

    this.drawArrowhead(
      ctx,
      { x: startX, y: startY },
      { x: endX, y: endY },
      direction
    );

    if (direction === 'BI_DIRECTIONAL') {
      this.drawArrowhead(
        ctx,
        { x: endX, y: endY },
        { x: startX, y: startY },
        direction
      );
    }
  }

  private drawPathLine(
    ctx: CanvasRenderingContext2D,
    startPos: { x: number; y: number },
    endPos: { x: number; y: number },
    color: string
  ): void {
    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const startX = startPos.x + dx / distance;
    const startY = startPos.y + dy / distance;
    const endX = endPos.x - dx / distance;
    const endY = endPos.y - dy / distance;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  private drawArrowhead(
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    direction: string
  ): void {
    const headLength = 10; // Length of the arrowhead
    const angle = Math.atan2(to.y - from.y, to.x - from.x);

    // Calculate the arrowhead points
    const arrowheadPoint1 = {
      x: to.x - headLength * Math.cos(angle - Math.PI / 6),
      y: to.y - headLength * Math.sin(angle - Math.PI / 6),
    };
    const arrowheadPoint2 = {
      x: to.x - headLength * Math.cos(angle + Math.PI / 6),
      y: to.y - headLength * Math.sin(angle + Math.PI / 6),
    };

    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(arrowheadPoint1.x, arrowheadPoint1.y);
    ctx.lineTo(arrowheadPoint2.x, arrowheadPoint2.y);
    ctx.lineTo(to.x, to.y);

    // Change arrowhead color based on direction
    if (direction === 'UN_DIRECTIONAL') {
      ctx.fillStyle = 'black'; // Uni-directional arrowhead in black
    } else if (direction === 'BI_DIRECTIONAL') {
      ctx.fillStyle = 'green'; // Bi-directional arrowhead in green
    }

    ctx.fill();
  }

  drawNode(ctx: CanvasRenderingContext2D, x: number, y: number, label: string) {
    const isAssignTask = this.nodeGraphService.getAssignTask();

    // Set node size and color conditionally
    const nodeColor = isAssignTask ? '#f00' : '#00f'; // Red for Assign Task, Blue otherwise
    const nodeRadius = isAssignTask ? 6 : 4; // Larger radius for Assign Task, default otherwise
    if (isAssignTask) {
      const outerCircleRadius = nodeRadius + 4; // Outer circle is slightly larger than the node
      ctx.beginPath();
      ctx.arc(x, y, outerCircleRadius, 0, 2 * Math.PI); // Outer circle
      ctx.strokeStyle = '#ff7373'; // Color for the outer circle (can be customized)
      ctx.lineWidth = 2; // Thickness of the outer circle's border
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI); // Draw circle with the specified radius
    ctx.fillStyle = nodeColor; // Use the determined color
    ctx.fill();

    // Add a label to the node
    // if(isAssignTask){
    // ctx.fillStyle = '#000'; // Black text color
    // ctx.font = '14px Arial';
    // ctx.fillText(label, x + 5, y+20); // Place label slightly right to the node
    // }
  }

  drawPathNode(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string
  ) {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI); // Draw circle with radius 10
    ctx.fillStyle = 'black';
    ctx.fill();
    // Set node style (for example, circle)
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, 2 * Math.PI); // Draw circle with radius 10
    ctx.fillStyle = color;
    ctx.fill();
  }

  getFloorMap(floor: string): string {
    switch (floor) {
      case 'Floor 1':
        return '../../assets/maps/Map3.svg';
      default:
        return '../../assets/maps/Map1.svg';
    }
  }

  onFloorChange(event: Event) {
    this.loadCanvas();
  }

  zoomIn() {
    this.zoomLevel *= 1.1;
    this.nodeGraphService.setZoomLevel(this.zoomLevel);
    this.loadCanvas();
  }

  zoomOut() {
    this.zoomLevel /= 1.1;
    this.nodeGraphService.setZoomLevel(this.zoomLevel);
    this.loadCanvas();
  }

  onMouseLeave() {
    this.isPanning = false;
    document.body.style.cursor = 'default'; // Ensure the cursor resets when mouse leaves the canvas
  }

  panStart(event: MouseEvent) {
    if (this.isPanning) {
      this.lastX = event.clientX;
      this.lastY = event.clientY;

      document.addEventListener('mousemove', this.panMove);
      document.addEventListener('mouseup', this.panEnd);
      document.body.style.cursor = 'grabbing';
    }
  }

  // Rest of your existing component methods like panStart(), toggleONBtn(), etc.
  panStartModelCanvas(event: MouseEvent) {
    // Handle pan start for modelCanvas
    console.log('Panning on Model Canvas', event);
  }

  panMove = (event: MouseEvent) => {
    if (this.isPanning) {
      const deltaX = event.clientX - this.lastX;
      const deltaY = event.clientY - this.lastY;
      this.lastX = event.clientX;
      this.lastY = event.clientY;

      this.offsetX += deltaX / this.zoomLevel;
      this.offsetY += deltaY / this.zoomLevel;
      this.nodeGraphService.setOffsetX(this.offsetX);
      this.nodeGraphService.setOffsetY(this.offsetY);
      this.loadCanvas();
    }
  };

  panEnd = () => {
    document.removeEventListener('mousemove', this.panMove);
    document.removeEventListener('mouseup', this.panEnd);
    if (this.isPanning) {
      document.body.style.cursor = 'grab';
    } else {
      document.body.style.cursor = 'default';
    }
  };

  handleZoom(event: WheelEvent) {
    event.preventDefault();
    const zoomIntensity = 0.1;
    const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    const mouseX = event.clientX - canvas.offsetLeft;
    const mouseY = event.clientY - canvas.offsetTop;
    const zoom = event.deltaY > 0 ? 1 - zoomIntensity : 1 + zoomIntensity;

    this.offsetX -= (mouseX - this.offsetX) * (zoom - 1);
    this.offsetY -= (mouseY - this.offsetY) * (zoom - 1);
    this.zoomLevel *= zoom;

    if (ctx) this.draw(ctx, new Image());
  }

  togglePan() {
    this.isPanning = !this.isPanning;
    // if(this.isPanning){}
    document.body.style.cursor = this.isPanning ? 'grab' : 'default';
  }

  async captureCanvas() {
    this.messageService.add({
      severity: 'info',
      summary: 'Capturing Screen',
      detail: 'Screen Capturing Turned On ',
      life: 4000,
    });
    try {
      const displayMediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {},
        audio: false,
      });

      // Introduce a delay of 2 seconds before proceeding
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const video = document.createElement('video');
      video.srcObject = displayMediaStream;
      video.play();

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      // setTimeout(() => {
      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context!.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Creating a PNG image from the canvas
        canvas.toBlob((blob) => {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob!);
          link.download = 'screen_capture.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, 'image/png');

        // Stop the stream after capture
        displayMediaStream.getTracks().forEach((track) => track.stop());
      });
      // }, 2000);
    } catch (err) {
      console.error('Error capturing screen:', err);
    }
  }
  toggleDashboard() {
    this.showDashboard = !this.showDashboard;
    if (this.showDashboard) {
      this.messageService.add({
        severity: 'info',
        summary: 'Dashboard',
        detail: 'Dashboard is visible',
        life: 2000,
      });
    }
  }

  toggleRecording() {
    this.recording = !this.recording;
    if (this.recording) {
      this.startRecording();
      this.messageService.add({
        severity: 'info',
        summary: 'Recording on',
        detail: 'Screen recording Turned On ',
        life: 4000,
      });
    } else {
      this.stopRecording();
      this.messageService.add({
        severity: 'info',
        summary: 'Recording off',
        detail: 'Screen recording Turned Off ',
        life: 4000,
      });
    }
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'application', // This may help to limit to the application window
        },
        audio: false,
      });
      this.recorder = new RecordRTC(stream, {
        type: 'video',
        mimeType: 'video/webm',
      });
      this.recorder.startRecording();
      this.stream = stream; // Store the stream reference
    } catch (error) {
      console.error('Error starting screen recording:', error);
      this.recording = false;
    }
  }

  stopRecording() {
    if (this.recorder) {
      this.recorder.stopRecording(() => {
        const blob = this.recorder.getBlob();
        const mp4Blob = new Blob([blob], { type: 'video/mp4' });
        this.invokeSaveAsDialog(mp4Blob, 'recording.mp4');
      });
    }

    // Stop all tracks in the stream to stop sharing
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null; // Clear the stream reference
    }
  }

  invokeSaveAsDialog(blob: Blob, fileName: string) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  }

  onClose(): void {
    this.showDashboard = false;
  }
}
