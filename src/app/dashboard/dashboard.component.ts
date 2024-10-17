import {
  Component,
  AfterViewInit,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import domtoimage from 'dom-to-image-more';
import RecordRTC from 'recordrtc';
import { ProjectService } from '../services/project.service';
import { environment } from '../../environments/environment.development';
import { UptimeComponent } from '../uptime/uptime.component';
import { ThroughputComponent } from '../throughput/throughput.component';

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
  @ViewChild(UptimeComponent) UptimeComponent!: UptimeComponent;
  @ViewChild(ThroughputComponent) throughputComponent!: ThroughputComponent;
  @ViewChild('myCanvas', { static: false })
  myCanvas!: ElementRef<HTMLCanvasElement>;
  eventSource!: EventSource;
  posEventSource!: EventSource;
  ONBtn = false;
  showDashboard = false;
  isDropdownOpen = false;
  selectedFloor = 'Floor 1';
  floors = ['Floor 1'];
  zoomLevel = 1.0;
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
  ratio: number = 1;
  origin : {x : number, y : number, w : number} = { x : 0, y : 0, w : 0 };
  plottedPoints: { id: number; x: number; y: number }[] = [];
  zoneType: ZoneType | null = null; // Selected zone type
  startX = 0;
  startY = 0;
  showChart2 = true; // Controls blur effect for Chart2
  showChart3 = true;
  robotImages: { [key: string]: HTMLImageElement } = {};
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
  selectedMap: any | null = null;
  mapImg: any | null = null;
  mapImageWidth: number = 0; // To store the width of the map image
  mapImageHeight: number = 0; // To store the height of the map image
  mapImageX: number = 0; // To store the X position of the map image
  mapImageY: number = 0; // To store the Y position of the map image
  draggingRobo: any = null; // Holds the robot being dragged
  selectedRobo: any = null;
  placeOffset: number = 50;
  robotToInitialize: any = null;
  isEnableMode: boolean = false;
  isMoveModeActive: boolean = false; // Track if move mode is enabled
  isDragging: boolean = false;
  isMapLoaded = false;
  isImage: boolean = false;
  updatedrobo: any;

  constructor(
    private projectService: ProjectService,
    private cdRef: ChangeDetectorRef
  ) {
    if (this.projectService.getIsMapSet()) return;
    // this.onInitMapImg(); // yet to remove..
  }

  async ngOnInit() {
    this.selectedMap = this.projectService.getMapData();
    if (!this.projectService.getMapData()) {
      await this.onInitMapImg();
      this.isMapLoaded = false;
      return;
    }
    await this.getMapDetails();
    this.loadCanvas();
    await this.initSimRoboPos();
    console.log(this.simMode);

    // this.toggleModelCanvas();
    // await this.fetchRoboPos();
  }

  ngAfterViewInit(): void {
    console.log('myCanvas:', this.myCanvas);
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
    this.robotImages = {
      robotB: new Image(),
    };
    this.assetImages = {
      docking: new Image(),
      charging: new Image(),
    };
    this.assetImages['docking'].src = 'assets/Asseticon/docking-station.svg';
    this.assetImages['charging'].src = 'assets/Asseticon/charging-station.svg';

    this.robotImages['robotB'] = new Image();
    this.robotImages['robotB'].src = 'assets/CanvasRobo/robotB.svg';
  }

  // yet to update pos and save it in map..
  async initSimRoboPos() {
    
    const imgWidth = this.mapImg.width * this.zoomLevel;
    const imgHeight = this.mapImg.height * this.zoomLevel;

    // Calculate the bottom-right corner position of the image
    let roboX = imgWidth - this.placeOffset;
    let roboY = imgHeight - 100;
    let i = 1;

    this.simMode = this.simMode.map((robo) => {
      // if (!robo.pos.x && !robo.pos.y) {
        roboX = imgWidth - this.placeOffset * i;
        robo.pos = { x: roboX, y: roboY, orientation: 90 };
        i++;
      // }
      return robo;
    });
  }

  addRightClickListener(canvas: HTMLCanvasElement) {
    canvas.addEventListener('contextmenu', (event) => {
      event.preventDefault(); // Prevent the default context menu

      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const imgX = (mouseX - this.mapImageX - this.offsetX) / this.zoomLevel;
      const imgY =
        (canvas.height - mouseY - this.mapImageY - this.offsetY) /
        this.zoomLevel;

      for (let robo of this.simMode) {
        const roboX = robo.pos.x;
        const roboY = this.mapImageHeight - robo.pos.y;
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
          // console.log(this.updatedrobo);
          return;
        }
      }

      /* for (let robo of this.robos) {
        const roboX = robo.pos.x;
        const roboY = this.mapImageHeight - robo.pos.y;
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
          console.log(this.updatedrobo);
          return;
        }
      } */
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

  async initializeRobo() {
    // Toggle between initializing and releasing the robot
    if (this.updatedrobo) {
      // If the robot is already initialized, release it
      if (this.updatedrobo.isInitialized) {
        // await this.updateEditedMap();
        this.updatedrobo.isInitialized = false;
        console.log(`Robot ${this.updatedrobo.amrId} released`);
        return;
        // Otherwise, initialize the robot
      } else {
        this.updatedrobo.isInitialized = true;
        console.log(`Robot ${this.updatedrobo.amrId} initialized`);
      }
    }

    // await this.updateEditedMap();
    // this.robotToInitialize = this.draggingRobo;
    this.robotToInitialize = this.updatedrobo; // yet to use instead of above line..
    this.hidePopup();

    await this.initializeRobot();
  }

  async initializeRobot(): Promise<void> {
    // console.log(this.robotToInitialize, this.ratio);

    let ratio = this.ratio ? this.ratio : 1;
    let quaternion = { x: 0, y: 0, z: 0, w: 1 };
    const transformedY =
      this.myCanvas.nativeElement.height - this.robotToInitialize.pos.y;
    this.robotToInitialize.pos.x = this.robotToInitialize.pos.x * ratio;
    this.robotToInitialize.pos.y = transformedY * ratio;

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
      alert('robo Initialized!');
      return;
    }
    if (data.msg) alert(data.msg);
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
      // console.log('updated sim robos position : ', this.simMode);

      // this.robos = Array.isArray(updatedData.robos) ? updatedData.robos : [];
    } catch (error) {
      console.error('Error updating map:', error);
    }
  }

  async toggleModelCanvas() {
    // this.fetchRoboPos ();
    this.showModelCanvas = !this.showModelCanvas;
    // if (!this.showModelCanvas) {      
    //   this.nodes = [];
    // } else {
    //   await this.getMapDetails();
    //   // await this.fetchRoboPos(); // Call fetchRoboPos when showing model canvas
    // }
    this.loadCanvas(); // Redraw the canvas based on the updated state
    // this.fetchRoboPos();
  }

  redrawCanvas() {
    const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Load the background image
      this.isImage = true;
      const img = new Image();
      img.src = `http://${this.projectService.getMapData().imgUrl}`;

      img.onload = () => {
        // Draw the image and other elements
        this.draw(ctx, img);
      };
    }
  }

  loadCanvas() {
    const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
  
    if (ctx) {
      const img = new Image();
      let imgName = this.projectService.getMapData();
      img.src = `http://${imgName.imgUrl}`;
  
      img.onload = () => {
        // Set canvas dimensions based on its container
        canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
        canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
  
        // Calculate the scaled image dimensions
        this.mapImageWidth = img.width * this.zoomLevel;
        this.mapImageHeight = img.height * this.zoomLevel;
  
        // Center the image on the canvas
        this.mapImageX = (canvas.width - this.mapImageWidth) / 2 + this.offsetX;
        this.mapImageY = (canvas.height - this.mapImageHeight) / 2 + this.offsetY;
  
        // Draw the image and other elements
        this.draw(ctx, img);
      };
    }
  }

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
    
  
    // Draw the image
    ctx.drawImage(img, 0, 0);
  
    this.simMode.forEach((robo) => {
      this.plotRobo(ctx, robo.pos.x, robo.pos.y, robo.pos.orientation);
    });
  
    this.robos.forEach(
      (robo) =>
        this.plotRobo(ctx, robo.pos.x, robo.pos.y, robo.roboDet.selected)
    );
  
    if (!this.showModelCanvas) {   
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
      // Re-plot the points of the zone
      // zone.pos.forEach((point, index) => {
      //   // Plot the first point in violet and others in red
      //   const isFirstPoint = index === 0;
      //   this.plotZonePoint(point.x, point.y, isFirstPoint);
      // });
      this.plottedPoints = zone.pos;
      this.zoneType = zone.type;
      this.drawLayer(ctx);
      this.plottedPoints = [];
    });

    this.assets.forEach((asset) =>
      this.plotAsset(ctx, asset.x, asset.y, asset.type)
    );
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

  addMouseDownListener(canvas: HTMLCanvasElement) {
    canvas.addEventListener('mousedown', (event) => {
      // if (!this.showModelCanvas) return;
      // if (event.button) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const transY = canvas.height - mouseY;
      // console.log(this.zoomLevel);
      
      // Adjust for zoom and pan
      const imgX = (mouseX - this.mapImageX - this.offsetX) / this.zoomLevel;
      const imgY = (transY - this.mapImageY - this.offsetY) / this.zoomLevel;

      for (let robo of this.simMode) {
        // console.log(this.zoomLevel);
        
        const roboX = robo.pos.x ;
        const roboY = this.mapImageHeight - robo.pos.y;
        const imageSize = 25; // Adjust to the sie of the robot image
        // console.log("robotXY"+roboX, roboY);
        // console.log("imgXY"+imgX, imgY);
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
          // this.offsetX = imgX - roboX; // Store offset to maintain relative position during drag
          // this.offsetY = imgY - roboY;
          this.draggingRobo = robo; // Store the robot being dragged
          this.isDragging = true;
          this.hidePopup();
          break;
        }
      }

      /* for (let robo of this.robos) {
        const roboX = robo.pos.x;
        const roboY = this.mapImageHeight - robo.pos.y;
        const imageSize = 25; // Adjust to the size of the robot image

        if (
          imgX >= roboX - imageSize &&
          imgX <= roboX + imageSize &&
          imgY >= roboY - imageSize &&
          imgY <= roboY + imageSize
        ) {
          // if (this.isRobotClicked(robo, imgX, imgY)) {
          if (robo.isInitialized) {
            console.log(
              `Robot ${robo.roboDet.id} is initialized and cannot move.`
            );
            return; // Do not allow dragging if the robot is initialized
          }
          this.hidePopup();
          this.draggingRobo = robo; // Store the robot being dragged
          // this.offsetX = imgX - roboX; // Store offset to maintain relative position during drag
          // this.offsetY = imgY - roboY;
          this.isDragging = true;
          // console.log(this.isDragging,this.draggingRobo);
          break;
        }
      } */
    });
  }

  addMouseUpListener(canvas: HTMLCanvasElement) {
    canvas.addEventListener('mouseup', async (event) => {
      if (this.isDragging) {
        this.isDragging = false;
        this.draggingRobo = null;
        this.redrawCanvas();
      }
    });
  }

  addMouseClickListener(canvas: HTMLCanvasElement) {
    canvas.addEventListener('click', (event) => {
      // if (!this.showModelCanvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      const transY = canvas.height - mouseY;
      // console.log(this.zoomLevel);
      
      // Adjust for zoom and pan
      const imgX = (mouseX - this.mapImageX - this.offsetX) / this.zoomLevel;
      const imgY = (transY - this.mapImageY - this.offsetY) / this.zoomLevel;

      console.log(
        'mouse is clicked in:',
        Math.round(imgX) * this.ratio,
        Math.round(imgY) * this.ratio
      );

      // Check if the click is within the bounds of the map image
      const isInsideMap =
        imgX >= 0 &&
        imgX <= this.mapImageWidth / this.zoomLevel &&
        imgY >= 0 &&
        imgY <= this.mapImageHeight / this.zoomLevel;

      if (!isInsideMap) {
        // console.log("hey");
        return; // Exit if the click is outside the map image
      }

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
          console.log(`Robot clicked: ${robo.roboDet.id}`);
          break;
        } else {
          // console.log('not_clicked');
        }
      }
    });
  }

  addMouseMoveListener(canvas: HTMLCanvasElement) {
    const tooltip = document.getElementById('Pos_tooltip')!;

    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const transY = canvas.height - mouseY;
      // Adjust for zoom and pan
      const imgX = (mouseX - this.mapImageX - this.offsetX) / this.zoomLevel;
      const imgY = (transY - this.mapImageY - this.offsetY) / this.zoomLevel;

      if (this.draggingRobo && this.isDragging) {
        let newX = (mouseX - this.mapImageX - this.offsetX) / this.zoomLevel;
        let newY = (mouseY - this.mapImageY - this.offsetY) / this.zoomLevel;
        // Update the position of the robot being dragged
        newX = Math.max(0, Math.min(newX, this.mapImageWidth / this.zoomLevel));
        newY = Math.max(
          0,
          Math.min(newY, this.mapImageHeight / this.zoomLevel)
        );

        // Update the robot's position
        this.draggingRobo.pos.x = newX;
        this.draggingRobo.pos.y = newY;

        // Redraw the canvas with the updated robot position
        this.redrawCanvas();
      }
      // Check if the mouse is within the bounds of the map image
      const isInsideMap =
        imgX >= 0 &&
        imgX <= this.mapImageWidth / this.zoomLevel &&
        imgY >= 0 &&
        imgY <= this.mapImageHeight / this.zoomLevel;

      if (isInsideMap) {
        // Set tooltip content and position
        tooltip.textContent = `X = ${Math.round(imgX) * this.ratio}, Y = ${
          Math.round(imgY) * this.ratio
        }`;
        tooltip.style.display = 'block';
        tooltip.style.left = `${event.clientX}`;
        tooltip.style.top = `${event.clientY}`; // Adjust 10px below the cursor
      } else {
        tooltip.style.display = 'none'; // Hide tooltip if outside
      }
    });

    canvas.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none'; // Hide tooltip when mouse leaves canvas
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
    robot.enabled = true;
    let data = await this.enable_robot(robot);
    // console.log(data);
    // console.log(`${robot.name} has been enabled.`);
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
    this.simMode = mapData.simMode;
    this.ratio = data.map.mpp;
    this.origin = {x : mapData.origin.x, y : mapData.origin.y, w : mapData.origin.w};
    this.nodes = mapData.nodes.map((node: any) => {
      // yet to interface in this component..
      node.nodePosition.x = (node.nodePosition.x - (this.origin.x || 0)) / (this.ratio || 1);
      node.nodePosition.y = (node.nodePosition.y - (this.origin.y || 0)) / (this.ratio || 1);
      return node;
    });

    this.edges = mapData.edges;

    this.assets = mapData.stations.map((asset: any) => {
      asset.x = ((asset.x - (this.origin.x || 0)) / (this.ratio || 1));
      asset.y = ((asset.y - (this.origin.y || 0)) / (this.ratio || 1));
      return asset;
    });

    this.zones = mapData.zones.map((zone: any) => {
      zone.pos = zone.pos.map((pos: any) => {
        pos.x = ((pos.x - (this.origin.x || 0)) / (this.ratio || 1));
        pos.y = ((pos.y - (this.origin.x || 0)) / (this.ratio || 1));
        return pos;
      });
      return zone;
    });

    this.robos = mapData.roboPos.map((robo: any) => {
      robo.pos.x = robo.pos.x / (this.ratio || 1);
      robo.pos.y = robo.pos.y / (this.ratio || 1);
      // console.log(
      //   'initial robo pos:',
      //   robo.pos.x * this.ratio,
      //   (this.mapImageHeight- robo.pos.y) * this.ratio
      // );

      return robo;
    });

    // yet to check..
    this.simMode = mapData.simMode.map((robo: any) => {
      robo.pos.x = robo.pos.x / (this.ratio || 1);
      robo.pos.y = robo.pos.y / (this.ratio || 1);

      return robo;
    });

    this.mapImg = new Image();
    let imgName = this.projectService.getMapData();
    this.mapImg.src = `http://${imgName.imgUrl}`;
  }

  drawElements(ctx: CanvasRenderingContext2D) {}

  async fetchRoboPos(x: number, y: number, yaw: number) {
    // console.log(amrPos);
    const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    const imageWidth = 35; // Set this to the actual width of the plotted image
    const imageHeight = 25; // Set this to the actual height of the plotted image

    // Clear only the previous image area
    // const clearPreviousImage = (x: number, y: number) => {
    //   ctx?.clearRect(
    //     x - imageWidth / 2,
    //     y - imageHeight / 2,
    //     imageWidth,
    //     imageHeight
    //   );
    // };
    const mapImage = new Image();
    let map = this.projectService.getMapData();
    mapImage.src = `http://${map.imgUrl}`;
    await mapImage.decode(); // Wait for the image to load

    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

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

      if (this.showModelCanvas) {
        this.redrawOtherElements(ctx, mapImage); // Pass the mapImage for transformations
      }
      // Draw the map image
      ctx.drawImage(mapImage, 0, 0);

      // if (i > 0) clearPreviousImage(amrPos[i - 1].x, amrPos[i - 1].y);
      const transformedY = canvas.height - y;
      // console.log(amrPos[i].x, amrPos[i].y);
      this.plotRobo(ctx, x, transformedY, yaw);
    }
  }

  plotRobo(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    orientation: number
  ) {
    const image = this.robotImages['robotB'];
    const imageSize = 25;

    if (image && ctx) {
      ctx.save(); // Save the current context before rotation
      ctx.translate(x, y); // Move the rotation point to the robot's center
      ctx.rotate((orientation * Math.PI) / 180); // Rotate by the given orientation angle (converted to radians)
      ctx.drawImage(
        image,
        -imageSize / 2,
        -imageSize / 2,
        imageSize * 1.3,
        imageSize
      );
      ctx.restore(); // Restore the context after rotation
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
      // Re-plot the points of the zone
      // zone.pos.forEach((point, index) => {
      //   // Plot the first point in violet and others in red
      //   const isFirstPoint = index === 0;
      //   this.plotZonePoint(point.x, point.y, isFirstPoint);
      // });
      this.plottedPoints = zone.pos;
      this.zoneType = zone.type;
      this.drawLayer(ctx);
      this.plottedPoints = [];
    });

    this.assets.forEach((asset) =>
      this.plotAsset(ctx, asset.x, asset.y, asset.type)
    );
    this.robos.forEach(
      (robo) =>
        this.plotRobo(ctx, robo.pos.x, robo.pos.y, robo.roboDet.selected) // this.selectedRobo === robo - replace..
    );
  }

  async onInitMapImg() {
    let project = this.projectService.getSelectedProject();
    let mapArr = [];

    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-project/${project._id}`,
      { credentials: 'include' }
    );
    if (!response.ok)
      console.error('Error while fetching map data : ', response.status);
    let data = await response.json();
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
    this.loadCanvas();
  }

  quaternionToYaw(w: number, x: number, y: number, z: number): number {
    // Calculate the yaw (rotation around the Z-axis)
    const yaw = Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z));

    // Convert yaw from radians to degrees, if necessary
    const yawDegrees = yaw * (180 / Math.PI);

    return yawDegrees;
  }

  async enableRobot() {
    this.selectedMap = this.projectService.getMapData();
    if (!this.selectedMap) {
      console.log('no map selected');
      return;
    }
    const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    // posEventSource
    const URL = `http://${environment.API_URL}:${environment.PORT}/stream-data/live-AMR-pos/${this.selectedMap.id}`;
    if (this.posEventSource) this.posEventSource.close();

    this.posEventSource = new EventSource(URL);
    this.posEventSource.onmessage = (event) => {
      if (this.isEnableMode) this.isEnableMode = true;
      const robotsData: any = {};

      try {
        const data = JSON.parse(event.data);
        // console.log(data.robots); // here it is..

        if (ctx && data.robots.length) {
          // Loop through each robot to update their pose and position
          data.robots.forEach(async (robot: any) => {
            let complexVal = {
              w: robot.pose.orientation.w,
              x: robot.pose.orientation.x,
              y: robot.pose.orientation.y,
              z: robot.pose.orientation.z,
            };

            let posX = robot.pose.position.x / this.ratio; // 0.05
            let posY = robot.pose.position.y / this.ratio; // 0.05

            let yaw = this.quaternionToYaw(
              complexVal.w,
              complexVal.x,
              complexVal.y,
              complexVal.z
            );

            // Store each robot's position and orientation using the robot ID
            robotsData[robot.id] = { posX, posY, yaw: yaw };
            console.log(robot.id, robot.pose.position.x, robot.pose.position.y);

            // yet to remove if cond..
            if (robot.pose.position.x && robot.pose.position.y)
              // Re-plot all robots
              await this.plotAllRobots(robotsData);
          });
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    this.posEventSource.onerror = (error) => {
      this.isEnableMode = false;
      console.error('SSE error:', error);
      this.posEventSource.close();
    };
  }

  async plotAllRobots(robotsData: any) {
    const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    const mapImage = new Image();
    let map = this.projectService.getMapData();
    mapImage.src = `http://${map.imgUrl}`;
    await mapImage.decode(); // Wait for the image to load

    if (ctx) {
      // Clear the whole canvas before redrawing the map and all robots
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate the scaled image dimensions and center the image on the canvas
      const imgWidth = mapImage.width * this.zoomLevel;
      const imgHeight = mapImage.height * this.zoomLevel;
      const centerX = (canvas.width - imgWidth) / 2;
      const centerY = (canvas.height - imgHeight) / 2;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(this.zoomLevel, this.zoomLevel);
      ctx.drawImage(mapImage, 0, 0);
      ctx.restore(); // Reset transformation after drawing the map

      // Plot each robot on the map
      Object.keys(robotsData).forEach((robotId) => {
        const { posX, posY, yaw } = robotsData[robotId];
        const transformedY = canvas.height - posY;
        // this.plotRobo(ctx, posX, transformedY, -yaw);

        const robotPosX = centerX + (posX * this.zoomLevel); // implemented when developed, need to ensure with the above line.
        const robotPosY = centerY + ((imgHeight - posY) * this.zoomLevel);
        this.plotRobo(ctx, robotPosX, robotPosY, -yaw);
        // const robotPosX = centerX + this.offsetX + (posX * this.zoomLevel);
        // const robotPosY = centerY + this.offsetY + ((canvas.height - posY) * this.zoomLevel);
      });

      // if (this.showModelCanvas) {
      //   this.drawNodesAndEdges(ctx, mapImage); // Draw nodes and edges if enabled
      // }
    }
  }

  drawNodesAndEdges(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
    // Plot nodes
    this.nodes.forEach((node) => {
        const transformedY = img.height - node.nodePosition.y;
        this.drawNode(ctx, node.nodePosition.x, transformedY, node.nodeId);
    });

    // Plot edges
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
}

  async showSpline() {
    if (!this.selectedMap.id) return;
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/stream-data/show-spline`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapId: this.selectedMap.id,
        }),
      }
    );
    let data = await response.json();
    if (data.isShowSplined) this.enableRobot();
  }
  // start-stop the operation!
  startStopOpt() {
    // this.showSpline();
    this.enableRobot();
    if (this.UptimeComponent) this.UptimeComponent.getUptimeIfOn(); // call the uptime comp function
    if (this.throughputComponent) this.throughputComponent.getThroughPutIfOn();
  }

  toggleONBtn() {
    this.ONBtn = !this.ONBtn;
    // if (this.ONBtn) this.getliveAmrPos(); // yet to uncomment!
    if (!this.ONBtn && this.eventSource) this.eventSource.close(); // try take of it..
  }

  getOnBtnImage(): string {
    return this.ONBtn
      ? '../../assets/icons/off.svg'
      : '../../assets/icons/on.svg';
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
    // const transformedY = img.height - y; // Flip the Y-axis
    // if (this.isPositionOccupied(x, transformedY)) {
    //   alert('This position is already occupied by a node or asset. Please choose a different location.');
    //   return;
    // }

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

    // this.assets = this.assets.map((asset) => {
    //   if (this.selectedAsset?.id === asset.id)
    //     asset.orientation = this.orientationAngle;
    //   return asset;
    // });
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

    const startX = startPos.x + (dx * threshold) / distance;
    const startY = startPos.y + (dy * threshold) / distance;
    const endX = endPos.x - (dx * threshold) / distance;
    const endY = endPos.y - (dy * threshold) / distance;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);

    if (direction === 'UN_DIRECTIONAL') {
      ctx.strokeStyle = 'black'; // Uni-directional in black
    } else if (direction === 'BI_DIRECTIONAL') {
      ctx.strokeStyle = 'green'; // Bi-directional in green
    }
    ctx.lineWidth = 2;
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

  private drawArrowhead(
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    direction: string
  ): void {
    const headLength = 15; // Length of the arrowhead
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
    // Set node style (for example, circle)
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI); // Draw circle with radius 10
    ctx.fillStyle = '#00f'; // Blue color
    ctx.fill();

    // Add a label to the node
    ctx.fillStyle = '#000'; // Black text color
    ctx.font = '12px Arial';
    ctx.fillText(label, x + 12, y); // Place label slightly right to the node
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
    this.zoomLevel *= 1.2;
    this.loadCanvas();
  }

  zoomOut() {
    this.zoomLevel /= 1.2;
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
    document.body.style.cursor = this.isPanning ? 'grab' : 'default';
  }

  captureCanvas() {
    const element = document.getElementById('container');
    console.log('Container element:', element); // Log the container to check if it exists
    if (element) {
      domtoimage
        .toPng(element)
        .then((dataUrl: string) => {
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = 'page_capture.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        })
        .catch((error: Error) => {
          console.error('Error capturing page:', error);
        });
    } else {
      console.error('Container element not found.');
    }
  }

  toggleDashboard() {
    this.showDashboard = !this.showDashboard;
  }

  toggleRecording() {
    this.recording = !this.recording;
    if (this.recording) {
      this.startRecording();
    } else {
      this.stopRecording();
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
}
