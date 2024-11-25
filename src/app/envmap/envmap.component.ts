import {
  Component,
  EventEmitter,
  Output,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener,
  ChangeDetectorRef,
  Renderer2,
  Input,
} from '@angular/core';
import { formatDate } from '@angular/common';
import { environment } from '../../environments/environment.development';
import { saveAs } from 'file-saver';
import { ProjectService } from '../services/project.service';
import { sequence } from '@angular/animations';
import { parse } from 'path';
import { response } from 'express';
import { CookieService } from 'ngx-cookie-service';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { SessionService } from '../services/session.service';
import { map } from 'rxjs';
interface Node {
  nodeId: string;
  sequenceId: number;
  nodeDescription: string;
  released: boolean;
  nodePosition: { x: number; y: number; orientation: number };
  quaternion:{x:number; y: number; z: number; w: number};
  actions: any[];
  intermediate_node: boolean;
  Waiting_node: boolean;
  charge_node: boolean;
  dock_node: boolean;
}
interface Edge {
  edgeId: string; //Unique edge identification
  sequenceId: number; //Number to track the sequence of nodes and edges in an order and to simplify order updates
  edgeDescription: string; //Additional information on the edge
  released: boolean; //"true" indicates that the edge is part of the base. "false" indicates that the edge is part of the horizon.
  startNodeId: string; //nodeId of startNode
  endNodeId: string; //nodeId of endNode
  maxSpeed: number; //Permitted maximum speed on the edge in m/s
  maxHeight: number; //Permitted maximum height of the vehicle, including the load, on edge in m
  minHeight: number; //Permitted minimal height of the load handling device on the edge in m
  orientation: number; //Orientation of the AGV on the edge in rad
  orientationType: string; //The value orientationType defines if it has to be interpreted relative to the global project specific map coordinate system or tangential to the edge
  direction: string; //Sets direction at junctions for line-guided or wire-guided vehicles, to be defined initially (vehicle-individual)
  rotationAllowed: boolean; //“true”: rotation is allowed on the edge. “false”: rotation is not allowed on the edge.
  maxRotationSpeed: number; //Maximum rotation speed in rad/s
  // Trajectory trajectory; //Defines the curve, on which the AGV should move between startNode and endNode
  length: number; //Length of the path from startNode to endNode
  action: any[]; //Array of actionIds to be executed on the edge
}
interface asset {
  id: number;
  x: number;
  y: number;
  type: string;
  orientation: number;
  undockingDistance: number;
  desc: string;
}
interface Zone {
  id: string;
  pos: any[];
  type: ZoneType | null;
}
interface Robo {
  roboDet: any;
  pos : {x : number, y : number, orientation : number}
}
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
  selector: 'app-envmap',
  templateUrl: './envmap.component.html',
  styleUrls: ['./envmap.component.css'],
  preserveWhitespaces: true
})
export class EnvmapComponent implements AfterViewInit {
  @Input() EnvData: any[] = [];
  @Input() currEditMap: boolean = false;
  @Input() currEditMapDet: any | null = null;
  @Output() currEditMapChange = new EventEmitter<any>();
  @Input() addEnvToEnvData!: (data: any) => void;
  @Output() refreshTable = new EventEmitter<void>();  // Add this
  @Output() closePopup = new EventEmitter<void>();
  @Output() newEnvEvent = new EventEmitter<any>();
  @Output() save = new EventEmitter<void>();//emit the save function
  @ViewChild('imageCanvas', { static: false }) imageCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pixTooltip') pixTooltip!: ElementRef;
  @ViewChild('overlayCanvas', { static: false }) overlayCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('imagePopupCanvas', { static: false }) imagePopupCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('OriginPopupCanvas', { static: false }) OriginPopupCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('resolutionInput') resolutionInput!: ElementRef<HTMLInputElement>;
  @ViewChild('xInput') xInput!: ElementRef<HTMLInputElement>;
  @ViewChild('yInput') yInput!: ElementRef<HTMLInputElement>;
  @ViewChild('nodeDetailsPopup', { static: false })
  nodeDetailsPopup!: ElementRef<HTMLDivElement>;
  @ViewChild('tooltip') tooltip!: ElementRef<HTMLDivElement>;


  projData: any;
  form: FormData | null = null;
  selectedImage: File | null = null;
  fileName: string | null = null;
  public mapName: string = '';
  public siteName: string = '';
  height: number | null = null;
  width: number | null = null;
  showImage: boolean = false;
  public imageSrc: string | null = null;
  showOptionsLayer: boolean = false;
  orientationAngle: number = 0;
  public nodes: Node[] = []; // Org_nodes
  public edges: Edge[] = []; // Org_edges
  public assets: asset[] = []; // Org_assets
  public zones: Zone[] = []; // Org_zones
  robos: Robo[] = []; // Org_robos
  selectedAction: string| null = null;
  validationError: string | null = null;
  savedEdge: Edge | null = null; // This will hold the saved edge details
  rightClickEnabled: boolean = false; // Control right-click functionality

  Nodes: {
    id: number;
    x: number;
    y: number;
    orientationAngle?: number;
    type: string;
  }[] = [];
  isDeleteModeEnabled: boolean = false;
  NodeDetails: {
    nodeID: string;
    sequenceId: number;
    nodeDescription: string;
    released: boolean;
    nodePosition: { x: number; y: number; orientation: number };
  }[] = []; // updated structure
  connections: { fromId: number; toId: number; type: 'uni' | 'bi' }[] = []; // connections
  dockingTypes = [
    { label: 'Mode 1', value: 'mode1' },
    { label: 'Mode 2', value: 'mode2' },
    // Add more options as needed
  ];

  isNodeDetailsPopupVisible = false; // Control popup visibility
  public ratio: number | null = null; // Store the resolution ratio (meters per pixel)
  origin : {x : number, y : number, w : number} = { x : 0, y : 0, w : 0 };
  plottingMode: 'single' | 'multi' | null = null;
  isPlottingEnabled: boolean = false;
  isDrawing: boolean = false;
  startX: number | null = null;
  startY: number | null = null;
  isOptionsMenuVisible = false;
  isCalibrationLayerVisible = false;
  showIntermediateNodesDialog: boolean = false;
  numberOfIntermediateNodes: any ;
  firstNode: Node | null = null;
  secondNode: Node | null = null;
  robotImages: { [key: string]: HTMLImageElement } = {};
  isRobotPopupVisible: boolean = false;
  tableData: { mapName: string; siteName: string }[] = []; // Holds table data
  points: { x: number; y: number }[] = [];
  Originpoints: { x: number; y: number }[] = [];

  showImagePopup: boolean = false;
  showOriginPopup: boolean = false;
  showDistanceDialog: boolean = false;
  distanceBetweenPoints: number | null = null;
  nodeCounter: number = 1; // Counter to assign node numbers
  edgeCounter: number = 1; // Counter to assign edge numbers
  actionCounter: number = 1; // Counter to assign action numbers
  assetCounter: number = 1; // counter to assign asset numbers
  zoneCounter: number = 1; // counter to assigh zone numbers
  zonePosCounter: number = 1; // counter to assign zone numbers
  selectedNode: Node | null = null;
  lastSelectedNode: { x: number; y: number } | null = null;
  node: { id: number; x: number; y: number }[] = []; // Nodes with unique IDs
  nodeDetails: {
    id: number;
    x: number;
    y: number;
    description: string;
    actions: string[]; // Can allow null if needed
    intermediate_node: boolean;
    waiting_node: boolean;
    charge_node: boolean;
    dock_node: boolean;
  } = {
    id: 1,
    x: 0,
    y: 0,
    description: '',
    actions: [], // Initialize with a non-null value
    intermediate_node: false,
    waiting_node: false,
    charge_node: false,
    dock_node: false
  };
  isMoveActionFormVisible: boolean = true;
  isDockActionFormVisible: boolean = true;
  isUndockActionFormVisible: boolean = true;
  private isDrawingLine: boolean = false; // Tracks if a line is being drawn
  private lineStartX: number | null = null;
  private lineStartY: number | null = null;
  private lineEndX: number | null = null;
  private lineEndY: number | null = null;
  // selectedAction: string = ''; // Initialize with an empty string or any other default value
  actions: any[] = []; // Array to hold the list of actions with parameters
  isDistanceConfirmed = false; // Flag to control the Save button
  isEnterButtonVisible = false;
  isCanvasInitialized = false;
  showError: boolean = false; // Flag to show error message
  direction: 'uni' | 'bi' |''| null = '';
  selectedAssetType: string | null = null;
  assetImages: { [key: string]: HTMLImageElement } = {};
  // selectedAsset: { x: number, y: number, type: string } | null = null;
  selectedRobo: Robo | null = null;
  selectedAsset: asset | null = null;
  draggingNode: boolean = false;
  draggingAsset: boolean = false;
  draggingRobo: boolean = false;
  private draggingZonePoint: boolean = false;
  private selectedZone: Zone | null = null;   
  private selectedZonePoint: { x: number; y: number } | null = null;
  isZonePlottingEnabled = false;
  plottedPoints: { id: number; x: number; y: number }[] = [];
  firstPlottedPoint: { id: number; x: number; y: number } | null = null;
  zoneType: ZoneType | null = null; // Selected zone type
  isPopupVisible: boolean = false; // Popup visibility
  public zonePointCount: number = 0; // Track the number of zone points plotted
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
  roboInitOffset: number = 60;
  draggingRobot: Robo | null = null; // Currently dragged robot
  deselectTimeout: any = null;
  currentEdge: Edge = {
    edgeId: '',
    sequenceId: 0,
    edgeDescription: '',
    released: false,
    startNodeId: '',
    endNodeId: '',
    maxSpeed: 0,
    maxHeight: 0,
    minHeight: 0,
    orientation: 0,
    orientationType: '',
    direction: 'UN_DIRECTIONAL',
    rotationAllowed: false,
    maxRotationSpeed: 0,
    length: 0,
    action: [],
  };  
  selectedMap : any | null = null;
  showPopup = false;
  zoneTypeList = Object.values(ZoneType); // Converts the enum to an array
  DockPopup: boolean = false; // To control the popup visibility
  popupPosition = { x: 0, y: 0 }; // To store the popup position
  undockingDistance: string = ''; // Input field for undocking distance
  description: string = ''; // Input field for description
  selectedAssetId: string | null = null; // Store the selected asset ID
  // private draggedNode: Node | null = null;
  private selectionStart: { x: number; y: number } | null = null;
  private selectionTransformStart : {x :number ; y : number} | null = null;
  private selectionEnd: { x: number; y: number } | null = null;
  private nodesToDelete: Node[] = [];
  isOpen: boolean = false;
  descriptionWarning: boolean = false;
  currMulNode : Node[] = [];
  currentQuaternion:{ x: number; y: number;z:number;w:number } | null = null;
  newOrientationAngle: number = 0;
  inputOrientationAngle: number = 0; // The value entered by the user
  // selectedNodeId: string; // Variable to store the selected node
  public selectedNodeId: string | null = null;

  isFullScreen: boolean = false;

  toggleFullScreen() {
    this.isFullScreen = !this.isFullScreen;
  }

  close1() {
    this.showImage = false;
    this.isFullScreen = false; // Reset fullscreen when closing
  }

  isEdgeDrawingInProgress: boolean = false; // Flag to track if drawing is in progress

  setDirection(direction: 'uni' | 'bi'): void {
    this.toggleOptionsMenu();
    this.deselectNode();
    this.direction = direction;
    this.firstNode = null;
    this.secondNode = null;
    this.isEdgeDrawingInProgress = true;
  }
  isPlottingAsset: boolean = false;
  selectAssetType(assetType: string) {
    this.toggleOptionsMenu();
    this.selectedAssetType = assetType;
    this.isPlottingAsset = true;

    // console.log("hey");
    
  }
  constructor(
    private cdRef: ChangeDetectorRef,
    private renderer: Renderer2,
    private projectService: ProjectService,
    private messageService:MessageService,
    private sessionService:SessionService,
  ) {
    if (this.currEditMap) this.showImage = true;
  }
  ngOnInit() {
    this.selectedMap = this.projectService.getMapData();
    if(!this.selectedMap) return;
    if (this.currEditMap) {            
      this.showImage = true;
      this.mapName = this.currEditMapDet.mapName;
      this.siteName = this.currEditMapDet.siteName;
      this.ratio = this.currEditMapDet.ratio;
      this.imageSrc = this.currEditMapDet.imgUrl;
      this.origin = {x : this.currEditMapDet.origin.x, y : this.currEditMapDet.origin.y, w : this.currEditMapDet.origin.w};
      this.nodes = this.currEditMapDet.nodes.map((node : Node)=>{
        node.nodePosition.x = ((node.nodePosition.x + (this.origin.x || 0)) / (this.ratio || 1));
        node.nodePosition.y = ((node.nodePosition.y + (this.origin.y || 0)) / (this.ratio || 1));
        return node;
      });
      this.edges = this.currEditMapDet.edges;
      this.assets = this.currEditMapDet.assets.map((asset : asset)=>{
        asset.x = ((asset.x + (this.origin.x || 0)) / (this.ratio || 1));
        asset.y = ((asset.y + (this.origin.y || 0)) / (this.ratio || 1));
        return asset;
      });
      this.zones = this.currEditMapDet.zones.map((zone : Zone)=>{
        zone.pos = zone.pos.map((pos)=>{
          pos.x = ((pos.x + (this.origin.x || 0)) / (this.ratio || 1));
          pos.y = ((pos.y + (this.origin.y || 0)) / (this.ratio || 1));
          return pos;
        })
        return zone;
      });
      this.robos = this.currEditMapDet.robos.map((robo : Robo)=>{
        robo.pos.x = robo.pos.x / (this.ratio || 1);
        robo.pos.y = robo.pos.y / (this.ratio || 1);
        return robo;
      })

      this.nodeCounter =
        parseInt(this.nodes[this.nodes.length - 1]?.nodeId) + 1
          ? parseInt(this.nodes[this.nodes.length - 1].nodeId) + 1
          : this.nodeCounter;
      // this.nodeCounter=1;
      this.edgeCounter =
        parseInt(this.edges[this.edges.length - 1]?.edgeId) + 1
          ? parseInt(this.edges[this.edges.length - 1].edgeId) + 1
          : this.edgeCounter;
      this.assetCounter =
        this.assets[this.assets.length - 1]?.id + 1
          ? this.assets[this.assets.length - 1].id + 1
          : this.assetCounter;
      this.zoneCounter =
        parseInt(this.zones[this.zones.length - 1]?.id) + 1
          ? parseInt(this.zones[this.zones.length - 1].id) + 1
          : this.zoneCounter;
      this.open();
    }
    else if(this.sessionService.isMapInEdit()){
      this.imageSrc = this.sessionService.getImage();
      let mapData=this.sessionService.getMapDetails();
      this.siteName=mapData.siteName;
      this.mapName=mapData.mapName;
      this.ratio=mapData.mpp;
      this.origin=mapData.origin;  
      this.nodes=mapData.nodes;    
      this.nodeCounter =
        parseInt(this.nodes[this.nodes.length - 1]?.nodeId) + 1
          ? parseInt(this.nodes[this.nodes.length - 1].nodeId) + 1
          : this.nodeCounter;
      this.edges=mapData.edges;
      this.edgeCounter =
      parseInt(this.edges[this.edges.length - 1]?.edgeId) + 1
        ? parseInt(this.edges[this.edges.length - 1].edgeId) + 1
        : this.edgeCounter;
      this.selectedImage = this.sessionService.base64toFile();
      // this.zones=mapData.zones;
      this.open();
    }
  }
  checkDescriptionLength() {
    // Check if the description exceeds 255 characters
    if (this.description && this.description.length > 255) {
      this.descriptionWarning = true;
    } else {
      this.descriptionWarning = false;
    }
  }
  orientationTypes = [
    { label: 'Global', value: 'GLOBAL' },
    { label: 'Tangential', value: 'Tangential' }
  ];
  
  ngAfterViewInit(): void {
    this.projData = this.projectService.getSelectedProject();

    if (!this.overlayCanvas || !this.imageCanvas) return;

    const canvas = this.overlayCanvas?.nativeElement;
    const imageCanvas = this.imageCanvas?.nativeElement;
    if (canvas && imageCanvas) {
      // Set the size of the overlay canvas to match the image canvas
      canvas.width = imageCanvas.width;
      canvas.height = imageCanvas.height;

      this.setupCanvas();
      this.isCanvasInitialized = true; // Avoid re-initializing the canvas
    } else {
      console.error('Canvas element(s) still not found');
    }
  }
  ngAfterViewChecked(): void {
    if (this.showImage && this.overlayCanvas && !this.isCanvasInitialized) {
      this.setupCanvas();
      this.isCanvasInitialized = true;
    }
  }
  getOverlayCanvas(): HTMLCanvasElement | null {
    return this.overlayCanvas?.nativeElement;
  }
  MuldelMode() {
    this.isDeleteModeEnabled = !this.isDeleteModeEnabled;
    this.selectionStart = null;
    this.selectionEnd = null;
    this.redrawCanvas(); // Clear any leftover selection box or drawing
  }
//   private isPositionOccupied(x: number, y: number): boolean {
//     // Check if the position is occupied by any existing node
//     const isNodeOccupied = this.nodes.some(node =>
//         Math.abs(node.pos.x - x)  && Math.abs(node.pos.y - y)
//     );

//     // Check if the position is occupied by any existing asset
//     const isAssetOccupied = this.assets.some(asset =>
//         Math.abs(asset.x - x)  && Math.abs(asset.y - y)
//     );

//     return isNodeOccupied || isAssetOccupied;
// }
  setupCanvas(): void {
    const canvas = this.getOverlayCanvas();
    const imageCanvas = this.imageCanvas?.nativeElement;
    if (!canvas || !imageCanvas) {
      console.error('Canvas element not found');
      return;
    }

    // Set the overlay canvas size to match the image canvas size
    canvas.width = imageCanvas.width;
    canvas.height = imageCanvas.height;

    // Ensure the canvas has a valid width and height
    if (canvas.width === 0 || canvas.height === 0) {
      console.error('Canvas width or height is zero');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.robotImages['robotA'] = new Image();
      this.robotImages['robotA'].src = 'assets/CanvasRobo/robotA.svg';

      this.robotImages['robotB'] = new Image();
      this.robotImages['robotB'].src = 'assets/CanvasRobo/robotB.svg';
      // Initialize assets and robots
      this.assetImages['docking'] = new Image();
      this.assetImages['docking'].src = 'assets/Asseticon/docking-station.svg';

      this.assetImages['charging'] = new Image();
      this.assetImages['charging'].src =
        'assets/Asseticon/charging-station.svg';


    } else {
      console.error('Failed to get canvas context');
    }
  }
  @HostListener('click', ['$event'])
  onOverlayCanvasClick(event: MouseEvent): void {
    const canvas = this.overlayCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y =
      canvas.height -
      (event.clientY - rect.top) * (canvas.height / rect.height);

    const selected = this.nodes.find(
      (node) => Math.abs(node.nodePosition.x - x) < 5 && Math.abs(node.nodePosition.y - y) < 5
    );

    // if (selected) {
    //   this.selectedNode = selected;
    //   console.log(
    //     `Node selected at position: (${x.toFixed(2)}, ${y.toFixed(2)})`
    //   );
    // }
  }
  isConfirmingDelete: boolean = false;
  isConfirmationVisible: boolean = false;
  isRoboConfirmationVisible: boolean = false;
  showDeleteConfirmation(): void {
    this.isConfirmingDelete = true;
  }
  deleteSelectedNode(): void {
    if (this.selectedNode) {
      // Show confirmation dialog
      this.isConfirmationVisible = true;
    } else {
      console.log('No node selected to delete.');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No node selected to delete.',
        life: 4000,
      });
    }
    this.isNodeDetailsPopupVisible = false;
  }
  confirmRoboDelete():void{
    if (this.selectedRobo) {
      this.robos = this.robos.filter(
        (robo) => robo.roboDet.id !== this.selectedRobo?.roboDet.id
      );
      this.redrawCanvas();
    }
    if (this.robotToDelete) {
      // Remove the robot from the robos array
      this.robos = this.robos.filter(r => r.roboDet.id !== this.robotToDelete.roboDet.id);
      // Redraw the canvas after deleting the robot
      this.redrawCanvas();
    }
    this.isRoboConfirmationVisible=false;
  }
  confirmDelete(): void {
    // if(this.isDeleteModeEnabled){
    if (this.nodesToDelete.length > 0) {
      // Remove selected nodes from the nodes array
      this.nodes = this.nodes.filter(
        (node) => !this.nodesToDelete.includes(node)
      );
      // Remove edges related to deleted nodes
      this.edges = this.edges.filter((edge) => {
        return !this.nodesToDelete.some(
          (node) => edge.startNodeId === node.nodeId || edge.endNodeId === node.nodeId
        );
      });
      // Clear the selected nodes
      this.nodesToDelete = [];

      this.messageService.add({
        severity: 'success',
        summary: 'Deleted',
        detail: 'Nodes Deleted Successfully',
        life: 4000,
      });

      // Redraw the canvas
      this.redrawCanvas();
    } else {
      console.log('No nodes selected for deletion.');
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No items selected for deletion.'
      });
    }1

    if (this.selectedAsset) {
      this.assets = this.assets.filter(
        (asset) => this.selectedAsset?.id !== asset.id
      );
      this.redrawCanvas();
    }

    if (this.selectedRobo) {
      this.robos = this.robos.filter(
        (robo) => robo.roboDet.id !== this.selectedRobo?.roboDet.id
      );
      this.redrawCanvas();
    }

    // Proceed with node deletion if confirmed
    if (this.selectedNode) {
      // Remove the node by its unique ID
      this.nodes = this.nodes.filter(
        (node) => node.nodeId !== this.selectedNode?.nodeId
      );
      this.messageService.add({
        severity: 'success',
        summary: 'Deleted',
        detail: 'Node Deleted Successfully',
        life: 4000,
      });
      if(this.isDeleteModeEnabled){
      // Remove from nodes array
      this.nodes = this.nodes.filter((node) => {
        return (
          node.nodePosition.x !== this.selectedNode?.nodePosition.x &&
          node.nodePosition.y !== this.selectedNode?.nodePosition.y
        );
      });

      // Remove edges related to the deleted node
      this.edges = this.edges.filter((edge) => {
        return (
          edge.startNodeId !== this.selectedNode?.nodeId &&
          edge.endNodeId !== this.selectedNode?.nodeId
        );
      });}
     
      // Clear the selected node
      this.selectedNode = null;
      // Redraw the canvas
      this.redrawCanvas();
    } else {
      console.log('No node selected to delete.');
    }
    // if (this.robotToDelete) {
    //   // Remove the robot from the robos array
    //   this.robos = this.robos.filter(r => r.roboDet.id !== this.robotToDelete.roboDet.id);
    //   // Redraw the canvas after deleting the robot
    //   this.redrawCanvas();
    // }
    // Disable delete mode after confirmation
    this.isDeleteModeEnabled = false;

    // Hide confirmation dialog
    this.isConfirmationVisible = false;
  }
  // confirmDelete(): void {
  //   let nodesDeleted = false;
  //   let assetDeleted = false;
  //   let roboDeleted = false;
  //   let nodeDeleted = false;

  //   // Check if any nodes are selected for deletion
  //   if (this.nodesToDelete.length > 0) {
  //     console.log('Selected nodes for deletion:', this.nodesToDelete.map(node => ({ nodeId: node.nodeId, node })));

  //     // Remove selected nodes from the nodes array
  //     this.nodes = this.nodes.filter(
  //       (node) => !this.nodesToDelete.includes(node)
  //     );

  //     // Remove edges related to deleted nodes
  //     this.edges = this.edges.filter((edge) => {
  //       return !this.nodesToDelete.some(
  //         (node) => edge.startNodeId === node.nodeId || edge.endNodeId === node.nodeId
  //       );
  //     });

  //     // Clear the selected nodes
  //     this.nodesToDelete = [];

  //     // Redraw the canvas
  //     this.redrawCanvas();

  //     nodesDeleted = true; // Mark that nodes were deleted
  //   }

  //   // Check if an asset is selected for deletion
  //   if (this.selectedAsset) {
  //     console.log('Selected asset for deletion:', this.selectedAsset);

  //     this.assets = this.assets.filter(
  //       (asset) => this.selectedAsset?.id !== asset.id
  //     );
  //     this.redrawCanvas();
  //     assetDeleted = true; // Mark that an asset was deleted
  //   }

  //   // Check if a robot is selected for deletion
  //   if (this.selectedRobo) {
  //     console.log('Selected robot for deletion:', this.selectedRobo);

  //     this.robos = this.robos.filter(
  //       (robo) => robo.roboDet.id !== this.selectedRobo?.roboDet.id
  //     );
  //     this.redrawCanvas();
  //     roboDeleted = true; // Mark that a robot was deleted
  //   }

  //   // Check if a node is selected for deletion
  //   if (this.selectedNode) {
  //     console.log('Selected node for deletion:', { nodeId: this.selectedNode.nodeId, node: this.selectedNode });

  //     // Remove the node by its unique ID
  //     this.nodes = this.nodes.filter(
  //       (node) => node.nodeId !== this.selectedNode?.nodeId
  //     );

  //     // Remove edges related to the deleted node
  //     this.edges = this.edges.filter((edge) => {
  //       return (
  //         edge.startNodeId !== this.selectedNode?.nodeId &&
  //         edge.endNodeId !== this.selectedNode?.nodeId
  //       );
  //     });

  //     // Clear the selected node
  //     this.selectedNode = null;

  //     // Redraw the canvas
  //     this.redrawCanvas();

  //     nodeDeleted = true; // Mark that a node was deleted
  //   }

  //   // Toast message logic: Show warning if nothing was selected or deleted
  //   if (!nodesDeleted && !assetDeleted && !roboDeleted && !nodeDeleted) {
  //     this.messageService.add({
  //       severity: 'warn',
  //       summary: 'Warning',
  //       detail: 'No items selected for deletion.'
  //     });
  //   } else {
  //     this.messageService.add({
  //       severity: 'success',
  //       summary: 'Success',
  //       detail: 'Deletion successful.'
  //     });
  //   }

  //   // Disable delete mode after confirmation
  //   this.isDeleteModeEnabled = false;

  //   // Hide confirmation dialog
  //   this.isConfirmationVisible = false;
  // }

  cancelDelete(): void {
    this.isConfirmingDelete
    this.isConfirmationVisible=false;
    this.isRoboConfirmationVisible = false;
    // Hide confirmation dialog without deleting
    // this.isDeleteModeEnabled = false;
  }

  closeImagePopup(): void {
    if(this.showOriginPopup=true){
      this.showOriginPopup=false;
    }
    this.showImagePopup = false;
      this.points = [];
      this.showDistanceDialog = false;
      this.distanceBetweenPoints = null; // Reset distance if applicable
      this.isDistanceConfirmed=false;
      if (this.resolutionInput) {
        this.resolutionInput.nativeElement.value = ''; // Reset the input field
      }
      this.validationError=null;
  }
  
  saveNodeDetails(x: string, y: string, orientation: string): void {
    this.validationError = '';
    
    if (!this.nodeDetails.description) {
      this.validationError = 'Node Description is required.';
    } 
    // If there is a validation error, don't save the details
    if (this.validationError) {
      return;
    }
    let quaternion=this.ToQuaternion_(0,0,parseInt(orientation));


    this.nodes = this.nodes.map(node => {
      if(this.selectedNode?.nodeId === node.nodeId) {
        node.actions = this.actions;
        node.quaternion = quaternion;        
      }
      return node;
    })
    console.log("hey out");
    this.storeNodestoLocal();
    // this.projectService.setNode();
    // Ensure the nodeDetails object includes the checkbox values
    // const updatedNodeDetails = {
    //   ...this.nodeDetails,  // Spread the existing details
    //   intermediate_node: this.nodeDetails.intermediate_node,
    //   waiting_node: this.nodeDetails.waiting_node,
    // };
    if (!x || !y || !orientation) {
      this.validationError = 'All fields are required.';
      return;
    }
  
    // Convert values to numbers
    const parsedX = parseFloat(x);
    const parsedY = parseFloat(y);
    const parsedOrientation = parseFloat(orientation);
  
    if (isNaN(parsedX) || isNaN(parsedY) || isNaN(parsedOrientation)) {
      this.validationError = 'Invalid input: Please enter valid numbers.';
      return;
    }
    
    const canvas = this.overlayCanvas.nativeElement;
    // console.log("Hey",canvas.width,canvas.height);
    // Validation: Check if coordinates are within map boundaries
    const mapWidth = canvas.width*this.ratio!-this.origin.x;  // Assuming the map image width
    const mapHeight = canvas.height*this.ratio!-this.origin.y; // Assuming the map image height
    // console.log("map",mapWidth,mapHeight);
    if (parsedX > mapWidth || parsedY > mapHeight) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: `Coordinates out of bounds: X should be between 0 and ${mapWidth.toFixed(3)}, Y should be between 0 and ${mapHeight.toFixed(3)}.`
      });
      return;
    }
    if (this.selectedNode) {
      const nodeIndex = this.nodes.findIndex(
        (node) => node.nodeId === this.selectedNode!.nodeId
      );
      this.selectedNode.nodePosition.x = (parsedX+this.origin.x||0)/this.ratio!||1;
      this.selectedNode.nodePosition.y = (parsedY+this.origin.y||0)/this.ratio!||1;
      this.selectedNode.nodePosition.orientation = parsedOrientation;
      console.log(this.selectedNode.nodePosition.x,this.selectedNode.nodePosition.y)
      if (nodeIndex !== -1) {        
        this.nodes[nodeIndex].nodeDescription = this.nodeDetails.description;
        this.nodes[nodeIndex].intermediate_node = this.nodeDetails.intermediate_node;
        this.nodes[nodeIndex].Waiting_node = this.nodeDetails.waiting_node;
        this.nodes[nodeIndex].charge_node = this.nodeDetails.charge_node;
        this.nodes[nodeIndex].dock_node = this.nodeDetails.dock_node;
      }
      this.redrawCanvas();
    }

    // Clear all the details for the previous node
    this.Nodes = []; // Clear the Nodes array
    this.selectedNode = null;
    this.resetParameters(); // Reset the parameters
    this.actions = []; // Clear the actions array
    this.selectedAction = ''; // Reset the selected action
    this.isNodeDetailsPopupVisible = false; // Hide the popup if needed
  }
  openActionForm(action: any): void {
    // Hide all other forms
    this.hideActionForms();
  
    // Show the relevant form based on the action type
    if (action.actionType === 'Move') {
      this.isMoveActionFormVisible = true;
      this.moveParameters = action.parameters;
    } else if (action.actionType === 'Dock') {
      this.isDockActionFormVisible = true;
      this.dockParameters = action.parameters;
    } else if (action.actionType === 'Undock') {
      this.isUndockActionFormVisible = true;
      this.undockParameters = action.parameters;
    }
  
    // Set the selected action
    this.selectedAction = action.actionType;
  
    // Remove the action from the list
    // this.actions = this.actions.filter(a => a.actionType !== action.actionType);
  }
  
  moveParameters = {
    maxLinearVelocity: 0,
    maxAngularVelocity: 0,
    maxToleranceAtGoalX: 0,
    maxToleranceAtGoalY: 0,
    maxToleranceAtGoalOrientation: 0,
    endPointOrientation: false,
    autoRobotMode: 'mode1', // Default mode
  };
  dockParameters = {
    maxLinearVelocity: 0,
    maxAngularVelocity: 0,
    maxToleranceAtGoalX: 0,
    maxToleranceAtGoalY: 0,
    maxToleranceAtGoalOrientation: 0,
    goalOffsetX: 0,
    goalOffsetY: 0,
    goalOffsetOrientation: '',
    endPointOrientation: false,
    dockingType: 'mode1',
  };
  undockParameters = {
    maxLinearVelocity: 0,
    maxAngularVelocity: 0,
    maxToleranceAtGoalX: 0,
    maxToleranceAtGoalY: 0,
    maxToleranceAtGoalOrientation: 0,
    endPointOrientation: false,
    undockingDistance: 0,
  };
  onActionChange(selectedValue: string): void {
    this.selectedAction = selectedValue;
    this.resetParameters();
    this.showActionForm();
  }  
  resetParameters(): void {
    this.moveParameters = {
      maxLinearVelocity: 0,
      maxAngularVelocity: 0,
      maxToleranceAtGoalX: 0,
      maxToleranceAtGoalY: 0,
      maxToleranceAtGoalOrientation: 0,
      endPointOrientation: false,
      autoRobotMode: 'mode1',
    };
    this.dockParameters = {
      maxLinearVelocity: 0,
      maxAngularVelocity: 0,
      maxToleranceAtGoalX: 0,
      maxToleranceAtGoalY: 0,
      maxToleranceAtGoalOrientation: 0,
      goalOffsetX: 0,
      goalOffsetY: 0,
      goalOffsetOrientation: '',
      endPointOrientation: false,
      dockingType: 'mode1',
    };
    this.undockParameters = {
      maxLinearVelocity: 0,
      maxAngularVelocity: 0,
      maxToleranceAtGoalX: 0,
      maxToleranceAtGoalY: 0,
      maxToleranceAtGoalOrientation: 0,
      endPointOrientation: false,
      undockingDistance: 0,
    };
  }
  showActionForm(): void {
    this.hideActionForms();
    if (this.selectedAction === 'Move') {
      this.isMoveActionFormVisible = true;
    } else if (this.selectedAction === 'Dock') {
      this.isDockActionFormVisible = true;
    } else if (this.selectedAction === 'Undock') {
      this.isUndockActionFormVisible = true;
    }
  }
  hideActionForms(): void {
    this.isMoveActionFormVisible = false;
    this.isDockActionFormVisible = false;
    this.isUndockActionFormVisible = false;
  }
  addAction(): void {
    if (this.selectedAction) {
      let action: any;

      const parameters = 
        this.selectedAction === 'Move' ? { ...this.moveParameters } :
        this.selectedAction === 'Dock' ? { ...this.dockParameters } :
        this.selectedAction === 'Undock' ? { ...this.undockParameters } :
        null;

      const existingAction = this.actions.find(action => action.actionType === this.selectedAction);

      if (existingAction) {
        this.actions = this.actions.map(action => {
          if(action.actionType === this.selectedAction) action.parameters = parameters;
          return action;
        })
      } else if (parameters) {
        this.actions.push({ actionType: this.selectedAction, parameters : parameters });
      }
  
      // Remove the selected action from dropdown options
      this.actionOptions = this.actionOptions.filter(option => option.value !== this.selectedAction);
  
      // Hide the action forms
      this.hideActionForms();
      // Clear the selected action
      this.selectedAction = null;
    }
  }
  lastSelectedAction: string | null = null;

  cancelAction(): void {
    // Hide all action forms
    this.hideActionForms();  
    // Reset the selected action
    this.selectedAction = null;       
    this.actionOptions = this.allActions.filter(option => !this.actions.some(a => a.actionType === option.value)); 
  }

  deleteActionFromNode(selectedAction : any){
    this.actions = this.actions.filter(action => action.actionType !== selectedAction.actionType );
    this.actionOptions = this.allActions.filter(option => !this.actions.some(a => a.actionType === option.value)); 
  }
  
  openMoveActionForm(): void {
    this.isMoveActionFormVisible = true;
    this.isDockActionFormVisible = true;
    this.isUndockActionFormVisible = true;
  }
  closeNodeDetailsPopup(): void {
    // Clear the selected actions
    this.actions = [];
    this.selectedAction = null;
    this.selectedNode = null;

    this.isNodeDetailsPopupVisible = false;
    this.hideActionForms();
  }
  
  allActions = [
    { label: 'Move', value: 'Move' },
    { label: 'Dock', value: 'Dock' },
    { label: 'Undock', value: 'Undock' }
  ];
  isOptionDisabled(option: string): boolean {
    return this.actions.some((action) => action.actionType === option);
  }
  // imageBase64: string | null = null;
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedImage = input.files[0];
      const file = input.files[0];
      // if (file) {
      //   const reader = new FileReader();
      //   reader.onload = (e: any) => {
      //     this.imageBase64 = e.target.result;
      //     console.log(this.imageBase64);
      //     // if(this.imageBase64) this.mapService.setOnCreateMapImg(this.imageBase64);  // Save to cookie after conversion
      //   };
      //   reader.readAsDataURL(file);
      // }
      this.fileName = file.name;
      this.showImage = false;

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.imageSrc = e.target!.result as string;
        // console.log(this.imageSrc);
        
      };
      reader.readAsDataURL(file);
    }
  }

  private startPoint: { x: number; y: number } | null = null; // Store the initial point

  openOriginPopup(): void {
    if(!this.ratio){
      this.messageService.add({
        severity: 'error',
        summary: 'Warning',
        detail: 'Please Enter Resolution before Locating Origin',
      });
      return
    }
    if (this.imageSrc) {
      this.showOriginPopup = true;
      this.cdRef.detectChanges();
  
      const canvas = this.OriginPopupCanvas?.nativeElement;
      if (!canvas) {
        console.error('Canvas element not found');
        return;
      }
  
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = this.imageSrc;
  
      img.onload = () => {
        this.Originpoints = []; // Clear previous points
  
        // Clear the canvas and draw the image
        ctx!.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = img.width;
        canvas.height = img.height;
        ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
  
        // Add event listeners for click, mousemove, and mouseup
        canvas.addEventListener('mousedown', (event) => this.onCanvasMouseDown(event));
        canvas.addEventListener('mousemove', (event) => this.onCanvasMouseMove(event));
        canvas.addEventListener('mouseup', (event) => this.onCanvasMouseUp(event));
      };
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Warning',
        detail: 'No image uploaded!',
      });
    }
  }
  
  private onCanvasMouseDown(event: MouseEvent): void {
    const canvas = this.OriginPopupCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
  
    // Calculate the click coordinates relative to the canvas
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    const transy =canvas.height -y;
    // Store the initial point
    this.startPoint = { x, y };
    this.isDrawing = true;
  
    // Draw the initial point
    const ctx = canvas.getContext('2d');
    ctx!.beginPath();
    ctx!.arc(x, y, 5, 0, 2 * Math.PI); // Circle of radius 5
    ctx!.fillStyle = 'red';
    ctx!.fill();
  }
  
  private onCanvasMouseMove(event: MouseEvent): void {
    const canvas = this.OriginPopupCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate mouse coordinates relative to the canvas
    const mouseX = Math.round((event.clientX - rect.left) * (canvas.width / rect.width));
    const mouseY = Math.round((event.clientY - rect.top) * (canvas.height / rect.height));
    const TransY = canvas.height -mouseY;
    // Update tooltip content and position (if needed)
    const tooltip = this.tooltip.nativeElement;
    tooltip.textContent = `(x: ${mouseX*this.ratio!}, y: ${TransY*this.ratio!})`;
    if (!this.isDrawing || !this.startPoint) return;
  
    // const canvas = this.OriginPopupCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    // const rect = canvas.getBoundingClientRect();
  
    // Calculate current mouse coordinates relative to the canvas
    const currentX = (event.clientX - rect.left) * (canvas.width / rect.width);
    const currentY = (event.clientY - rect.top) * (canvas.height / rect.height);
  
    // Redraw the image and point to clear previous lines
    const img = new Image();
    img.src = this.imageSrc!;
  
    img.onload = () => {
      ctx!.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
      ctx!.drawImage(img, 0, 0, canvas.width, canvas.height); // Redraw image
  
      // Redraw the initial point
      ctx!.beginPath();
      ctx!.arc(this.startPoint!.x, this.startPoint!.y, 6, 0, 2 * Math.PI);
      ctx!.fillStyle = 'red';
      ctx!.fill();
  
      // Draw the line with an arrow
      this.drawArrow(ctx!, this.startPoint!.x, this.startPoint!.y, currentX, currentY);
    };
  }
  
  private onCanvasMouseUp(event: MouseEvent): void {
    if (!this.isDrawing || !this.startPoint) return;

    const canvas = this.OriginPopupCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();

    // Get the final mouse position
    const finalX = (event.clientX - rect.left) * (canvas.width / rect.width);
    const finalY = (event.clientY - rect.top) * (canvas.height / rect.height);
    const toX =(finalX * this.ratio!)
    const toY =(canvas.height-finalY)*this.ratio!||1
    // Calculate the angle relative to the canvas X-axis
    const dx = this.startPoint.x - finalX; // X difference
    const dy = this.startPoint.y - finalY; // Y difference (inverted)
    const transY = canvas.height - dy;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI); // Angle in degrees

    console.log("hey", 'X:', finalX, 'Y:', transY, 'W (Angle):', angle);
 
    // Update the origin object with the calculated values
    this.origin = { x: this.startPoint.x*this.ratio!, y: (canvas.height-this.startPoint.y)*this.ratio!, w: angle };

    // Reset the drawing state
    this.isDrawing = false;
    this.startPoint = null;
    this.showOriginPopup = false;
}
  
  // Helper function to draw a line with an arrow
  private drawArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number): void {
    const headLength = 10; // Length of the arrowhead
    const maxLength = 50; // Maximum length of the arrow
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy); // Calculate the distance from start to end

    // Normalize dx and dy to get the direction
    let directionX = dx / distance;
    let directionY = dy / distance;

    // Limit the distance if it exceeds maxLength
    if (distance > maxLength) {
        toX = fromX + directionX * maxLength;
        toY = fromY + directionY * maxLength;
    }

    // Draw the line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw the arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
        toX - headLength * Math.cos(Math.atan2(dy, dx) - Math.PI / 6),
        toY - headLength * Math.sin(Math.atan2(dy, dx) - Math.PI / 6)
    );
    ctx.lineTo(
        toX - headLength * Math.cos(Math.atan2(dy, dx) + Math.PI / 6),
        toY - headLength * Math.sin(Math.atan2(dy, dx) + Math.PI / 6)
    );
    ctx.lineTo(toX, toY);
    ctx.closePath();
    ctx.fillStyle = 'red';
    ctx.fill();
  }
  
  openImagePopup(): void {
    if (this.imageSrc) {
      this.showImagePopup = true;
      this.cdRef.detectChanges();

      const canvas = this.imagePopupCanvas?.nativeElement;
      if (!canvas) {
        console.error('Canvas element not found');
        return;
      }

      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = this.imageSrc;

      img.onload = () => {
        // Clear the points array
        this.points = [];

        // Clear the canvas
        ctx!.clearRect(0, 0, canvas.width, canvas.height);

        // Set canvas dimensions and draw the image
        canvas.width = img.width;
        canvas.height = img.height;
        ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    } else {
      // alert('No image uploaded.');
      this.messageService.add({
        severity: 'error',
        summary: 'Warning',
        detail: 'No image uploaded.!',
      });
    }
  }
  private calculateDistance(
    point1: { x: number; y: number },
    point2: { x: number; y: number }
  ): number {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );
  }
  updateEditedMap() {    
    this.nodes = this.nodes.map((node)=>{
      // node.nodePosition.x = ((node.nodePosition.x * (this.ratio || 1)));
      // node.nodePosition.y = ((node.nodePosition.y * (this.ratio || 1)));
      node.nodePosition.x = ((node.nodePosition.x * (this.ratio || 1)) - (this.origin.x || 0));
      node.nodePosition.y = ((node.nodePosition.y * (this.ratio || 1)) - (this.origin.y || 0));
      return node;
    })

    this.assets = this.assets.map((asset) => {
      asset.x = ((asset.x * (this.ratio || 1)) - (this.origin.x || 0));
      asset.y = ((asset.y * (this.ratio || 1)) - (this.origin.y || 0));
      return asset;
    });

    this.zones = this.zones.map((zone) => {
      zone.pos = zone.pos.map((pos) => {
        pos.x = ((pos.x * (this.ratio || 1)) - (this.origin.x || 0));
        pos.y = ((pos.y * (this.ratio || 1)) - (this.origin.y || 0));
        return pos;
      });
      return zone;
    });

    this.robos = this.robos.map((robo) => {
      robo.pos.x = ((robo.pos.x * (this.ratio || 1)));
      robo.pos.y = ((robo.pos.y * (this.ratio || 1)));
      return robo;
    });

    let editedMap = {
      mapName: null,
      siteName: null,
      mpp: null,
      origin: null,
      nodes: this.nodes,
      edges: this.edges,
      zones: this.zones,
      stations: this.assets,
      roboPos: this.robos,
      isFleetup: this.projectService.getIsFleetUp()
    };

    fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/update-map/${this.mapName}`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedMap),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        const { updatedData } = data;
        this.nodes = updatedData.nodes;
        this.edges = updatedData.edges;
        this.assets = updatedData.stations;
        this.zones = updatedData.zones;
        this.robos = Array.isArray(updatedData.robos) ? updatedData.robos : [];

        // Success Toast
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Map updated successfully!',
        });
        this.closePopup.emit(); // Close the popup after update
      })
      .catch((error) => {
        console.error('Error updating map:', error);

        // Error Toast
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update the map. Please try again later.',
        });
      });
  }
  ToQuaternion_(roll : number, pitch : number, yaw : number){
    yaw = (yaw * 3.14) / 180;
    pitch = (pitch * 3.14) / 180;
    roll = (roll * 3.14) / 180;

    const cy = Math.cos(yaw * 0.5);
    const sy = Math.sin(yaw * 0.5);
    const cr = Math.cos(roll * 0.5);
    const sr = Math.sin(roll * 0.5);
    const cp = Math.cos(pitch * 0.5);
    const sp = Math.sin(pitch * 0.5);

    const q = {
      x: cy * sr * cp - sy * cr * sp,
      y: cy * cr * sp + sy * sr * cp,
      z: sy * cr * cp - cy * sr * sp,
      w: cy * cr * cp + sy * sr * sp,
    };

    return q;
  };
  saveOpt() {
    if (!this.nodes || this.nodes.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No Nodes are plotted',
        life: 4000,
      });
      return;
    }
      // Check for nodes not connected as startNodeId or endNodeId of any edges
    const connectedNodeIds = new Set(this.edges.flatMap(edge => [edge.startNodeId, edge.endNodeId]));
    const unconnectedNodes = this.nodes.filter(node => !connectedNodeIds.has(node.nodeId));

    if (unconnectedNodes.length > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Some nodes are not connected to any edges. Please connect all nodes before saving.',
        life: 4000,
      });
      return;
    }
    if (this.currEditMap) {
      this.updateEditedMap();
      return;
    }

    if (!this.selectedImage) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'File missing!',
        life: 4000,
      });
      return;
    }

    this.nodes = this.nodes.map((node) => {
      node.nodePosition.x = ((node.nodePosition.x * (this.ratio || 1)) - (this.origin.x || 0));
      node.nodePosition.y = ((node.nodePosition.y * (this.ratio || 1)) - (this.origin.y || 0));
      return node;
    });

    this.assets = this.assets.map((asset) => {
      asset.x = ((asset.x * (this.ratio || 1))- (this.origin.x || 0));
      asset.y = ((asset.y * (this.ratio || 1))- (this.origin.y || 0));
      return asset;
    });

    this.zones = this.zones.map((zone) => {
      zone.pos = zone.pos.map((pos) => {
        pos.x = ((pos.x * (this.ratio || 1))- (this.origin.x || 0));
        pos.y = ((pos.y * (this.ratio || 1))- (this.origin.y || 0));
        return pos;
      });
      return zone;
    });

    this.robos = this.robos.map((robo) => {
      robo.pos.x = ((robo.pos.x * (this.ratio || 1))- (this.origin.x || 0));
      robo.pos.y = ((robo.pos.y * (this.ratio || 1))- (this.origin.y || 0));
      return robo;
    });
    
    let orientation = {x :0, y : 0, z : 0, w : 0};
    if(this.nodes.length)
    orientation = this.ToQuaternion_(0,0,this.nodes[0].nodePosition.orientation);

    let roboInit  = {
      id: 0,
      pose: {
        position: {
            x: this.nodes[0].nodePosition.x,
            y: this.nodes[0].nodePosition.y,
            z: this.nodes[0].nodePosition.orientation
        },
        orientation: orientation
      }
    }

    this.form = new FormData();
    const mapData = {
      projectName: this.projData.projectName,
      siteName: this.siteName,
      mapName: this.mapName,
      mpp: this.ratio,
      origin: this.origin,
      imgUrl: '',
      zones: this.zones,
      edges: this.edges,
      nodes: this.nodes,
      stations: this.assets,
      roboPos: this.robos,
      isFleetup: this.projectService.getIsFleetUp()
    };

    this.form?.append('mapImg', this.selectedImage);
    this.form?.append('mapData', JSON.stringify(mapData));



    fetch(`http://${environment.API_URL}:${environment.PORT}/dashboard/maps`, {
      method: 'POST',
      credentials: 'include',
      body: this.form,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.exists === true || data.isFileExist === false) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: data.msg,
            life: 4000,
          });
          return;
        }

        if (data.map) {
          const mapCreatedAt = new Date(data.map.createdAt);
          const createdAt = mapCreatedAt.toLocaleString('en-IN', {
            month: 'short',
            year: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
          });
          

          if(!this.EnvData.length){
            this.projectService.setMapData({
              id: data.map._id,
              mapName: data.map.mapName,
              siteName: this.siteName,
              date: createdAt,
              createdAt: data.map.createdAt,
              imgUrl: data.map.imgUrl,
            });
            this.projectService.setIsMapSet(true);
            this.selectedMap = {
              id: data.map._id,
              mapName: data.map.mapName,
              siteName: this.siteName,
              date: createdAt,
              createdAt: data.map.createdAt,
              imgUrl: data.map.imgUrl,
            };
            // return;
          }

          this.EnvData.push({
            id: data.map._id,
            mapName: data.map.mapName,
            siteName: this.siteName,
            date: createdAt,
            createdAt: data.map.createdAt,
          });

          this.EnvData.sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          this.cdRef.detectChanges();
          this.refreshTable.emit(); // Emit the event to refresh the table
          // window.location.reload();
        }

        // Success toast notification
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Map saved successfully',
          life: 4000,
        });
        
        this.closePopup.emit();
      })
      .catch((error) => {
        console.error('Error occurred:', error);

        // Error toast notification
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save map. Please try again.',
          life: 4000,
        });
      });

    this.form = null;
    
  }
  confirmDistance(): void {
    if (
      this.distanceBetweenPoints === null ||
      this.distanceBetweenPoints <= 0
    ) {
      this.showError = true; // Show error message if input is invalid
      return; // Exit the function if validation fails
    }

    this.showError = false; // Hide error message if input is valid

    const distanceInPixels = this.calculateDistance(
      this.points[0],
      this.points[1]
    );
    console.log(`Distance entered: ${this.distanceBetweenPoints} meters`);

    if (distanceInPixels !== 0) {
      this.ratio = this.distanceBetweenPoints / distanceInPixels;
      console.log(`Resolution (meters per pixel): ${this.ratio.toFixed(2)}`);

      // Update the resolution input field
      if (this.resolutionInput) {
        this.resolutionInput.nativeElement.value = this.ratio.toFixed(2);
      }
    } else {
      console.log('Distance in pixels is zero, cannot calculate ratio.');
    }

    this.showDistanceDialog = false;
    this.isDistanceConfirmed = true; // Make the Save button visible
  }
  saveCanvas(): void {
    const canvas = this.imagePopupCanvas.nativeElement;
    // const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    this.distanceBetweenPoints = null; // Reset distance if applicable
    // link.href = dataURL;
    // link.download = 'canvas-image.png';
    link.click();
    this.showImagePopup = false;
    this.isDistanceConfirmed = false; // Reset the state for future use
    this.save.emit;
  }
  clearCanvas(): void {
    const canvas = this.imagePopupCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Reset the points array and hide the distance dialog
      this.points = [];
      this.showDistanceDialog = false;
      this.distanceBetweenPoints = null; // Reset distance if applicable
      this.isDistanceConfirmed=false;

      // Redraw the image if necessary without resetting canvas size
      const img = new Image();
      img.src = this.imageSrc || '';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw image on the cleared canvas
      };
    }
    console.clear();
  }

  @HostListener('click', ['$event'])
  onImagePopupCanvasClick(event: MouseEvent): void {
    if (!this.showImagePopup || !this.imagePopupCanvas) return;

    const targetElement = event.target as HTMLElement;

    // Ignore clicks on the "close" button
    if (targetElement.classList.contains('close-btn')) {
      return;
    }

    // Ignore clicks on the "clear" button
    if (targetElement.classList.contains('clear-btn')) {
      return;
    }

    const canvas = this.imagePopupCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);

    if (this.points.length < 2) {
      this.points.push({ x, y });
      this.plotPointOnImagePopupCanvas(x, y);

      if (this.points.length === 2) {
        console.log('Two points plotted:', this.points);
        const distance = this.calculateDistance(this.points[0], this.points[1]);
        console.log(`Distance between points: ${distance.toFixed(2)} pixels`);
        if (distance === 0) {
          this.messageService.add({
            severity: 'error',
            summary: 'Two points are plotted in a same located',
            detail: 'Both Points are plotted in a same location, so kindly re-point it',
          });
          // Clear the points and re-draw the canvas to remove the second point
          this.points = [];
          this.clearCanvas();
          return;
        }
  
        console.log(`Distance between points: ${distance.toFixed(2)} pixels`);
        this.showDistanceDialog = true; // Show the distance input dialog
      }
    }
  }
  private plotPointOnImagePopupCanvas(x: number, y: number): void {
    const canvas = this.imagePopupCanvas.nativeElement;
    const ctx = canvas.getContext('2d')!;

    // Plot the node on the canvas
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();

    // Add the node to the nodes array with an ID
    // const nodeId = this.nodeCounter++;
    this.Nodes.push({
      id: this.nodeCounter,
      x: x,
      y: y,
      type: this.plottingMode || 'single',
    });

    // Log the node details in JSON format
    this.logNodeDetails();
  }
  private logNodeDetails(): void {
    const nodesJson = JSON.stringify(this.Nodes, null, 2);
    console.log('Node details:', nodesJson);
  }
  onInputResolution(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.ratio = Number(input.value);
  }
  // originX:number | null = null;
  // originY:number | null = null;
  open(): void {
    this.validationError = null;
    if (!this.currEditMap)
      if (this.mapName && this.siteName) {
        for (let map of this.EnvData) {
          if (this.mapName.toLowerCase() === map.mapName?.toLowerCase()) {
            this.validationError="Map name seems already exists, try another";
            return;
          }
        }
      }
      if (this.resolutionInput && this.resolutionInput.nativeElement) {
        const resolutionInputValue = this.resolutionInput.nativeElement.value;
  
        if (!this.ratio) {
          this.ratio = Number(resolutionInputValue);
          if (!this.ratio || isNaN(this.ratio)) {
            this.validationError = 'Please provide a valid resolution or click Locate.';
            return;
          }
        }
      } else {
        console.error('Resolution input element not found via ViewChild.');
      }

    if (this.mapName && this.siteName && this.imageSrc ) {
      this.fileName = null;
      this.showImage = true;
      const img = new Image();
      img.src = this.imageSrc;

      img.onload =  () => {
        if (this.imageCanvas && this.imageCanvas.nativeElement) {
          const canvas = this.imageCanvas.nativeElement;
          const ctx = canvas.getContext('2d')!;

          canvas.width = this.width || img.width;
          canvas.height = this.height || img.height;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          if (this.overlayCanvas && this.overlayCanvas.nativeElement) {
            const overlay = this.overlayCanvas.nativeElement;
            overlay.width = canvas.width;
            overlay.height = canvas.height;
            this.redrawCanvas();
          }
          if(this.selectedImage && !this.sessionService.isMapInEdit()){
            this.sessionService.storeImage(this.selectedImage)
            this.sessionService.storeMapDetails({
              siteName: this.siteName,
              mapName: this.mapName,
              mpp: this.ratio,
              origin: this.origin,
            })
            this.sessionService.onMapEdit();
          }
          
        }
      };

    }
    else{
      this.validationError="Please enter Map name and Site name"
    }

  }
  close(): void {
    this.currEditMapChange.emit(false);
    this.showImage = true;
    this.closePopup.emit(); // Then close the popup
    this.sessionService.deleteImage();
    this.sessionService.deleteMapEdit();
    this.sessionService.delMapDetails();
  }
  private isPointInZone(x: number, y: number, zonePoints: any[]): boolean {
    const ctx = this.overlayCanvas.nativeElement.getContext('2d');
    if (!ctx) return false;

    ctx.beginPath();
    ctx.moveTo(zonePoints[0].x, zonePoints[0].y);
    for (let i = 1; i < zonePoints.length; i++) {
      ctx.lineTo(zonePoints[i].x, zonePoints[i].y);
    }
    ctx.closePath();

    // Use canvas's isPointInPath method to check if the click is inside the zone
    return ctx.isPointInPath(x, y);
  }
  private isPointNearFirstZonePoint(x: number, y: number, firstPoint: any, threshold: number = 6): boolean {
    const ctx = this.overlayCanvas.nativeElement.getContext('2d');
    if (!ctx) return false;
    ctx.beginPath();
    const distance = Math.sqrt((x - firstPoint.x) ** 2 + (y - firstPoint.y) ** 2);
    return distance < threshold;
  }
  public showZoneText: boolean = false;
  robotToDelete: any; // Store the robot to be deleted
  originalEdgeDetails: any = null;  // Can initialize it as null or {}
  private getNodeById(nodeId: string): Node | undefined {
    return this.nodes.find((node) => node.nodeId === nodeId);
  }
  
  private calculateDistanceBetweenNodes(startNodeId: string, endNodeId: string): number | null {
    const startNode = this.getNodeById(startNodeId);
    const endNode = this.getNodeById(endNodeId);
  
    if (startNode && endNode) {
      const dx = (endNode.nodePosition.x - startNode.nodePosition.x)-this.origin.x;
      const dy = (endNode.nodePosition.y - startNode.nodePosition.y)-this.origin.y;
      const dis=Math.sqrt(dx * dx + dy * dy);
      const dist=(dis*this.ratio!)
      return parseFloat(dist.toFixed(2));
    }
    return null;
  }
  
  @HostListener('document:contextmenu', ['$event'])
  onRightClick(event: MouseEvent): void {
    if (this.isMultiNodePlotting) {
      event.preventDefault(); // Block right-click interaction
      this.messageService.add({
        severity: 'info',
        summary: 'Action Restricted',
        detail: 'Right-click is disabled while plotting multiple nodes.',
      });
      return;
    }
    event.preventDefault();
    // if (!this.rightClickEnabled) {
    //   event.preventDefault(); // Block right-click interaction

    //   this.messageService.add({
    //     severity: 'info',
    //     summary: 'Action Restricted',
    //     detail: 'Please plot both nodes before interacting.'
    //   });
    //   return;
    // }
    const rect = this.overlayCanvas.nativeElement.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (this.overlayCanvas.nativeElement.width / rect.width);
    const y = (event.clientY - rect.top) * (this.overlayCanvas.nativeElement.height / rect.height);

  for (const zone of this.zones) {

    const firstPoint = zone.pos[0]; // The first point of the zone
    if (this.isPointNearFirstZonePoint(x, y, firstPoint)) {
      this.zoneType = zone.type; // Prepopulate the selected zone type
      this.selectedZone = zone; // Store the selected zone
      this.isPopupVisible = true;
      this.isDeleteVisible=true;
      // this.showZoneTypePopup(); // Display the popup
      return;
    }
  }
    for (const robo of this.robos) {
      if (this.isRobotClicked(robo, x, y)) {
        this.robotToDelete = robo;  // Store the robot that was right-clicked
        this.isRoboConfirmationVisible = true;
        // const confirmDelete = confirm('Do you want to delete this robot?');
        // if (confirmDelete) {
        //   // Remove the robot from the robos array
        //   this.robos = this.robos.filter(r => r.roboDet.id !== robo.roboDet.id);
        //   // Redraw the canvas after deleting the robot
        //   this.redrawCanvas();
        // }
        return;
      }
    }
    // Check if a node is clicked
    for (const node of this.nodes) {      
      if (this.isNodeClicked(node, x, y) ) {
        this.selectedNode=node;
        this.currentQuaternion=node.quaternion;
        this.nodeDetails.description = this.selectedNode.nodeDescription;
        this.nodeDetails.intermediate_node = this.selectedNode.intermediate_node;
        this.nodeDetails.waiting_node = this.selectedNode.Waiting_node;
        this.nodeDetails.charge_node = this.selectedNode.charge_node;
        this.nodeDetails.dock_node = this.selectedNode.dock_node;
        this.actions = this.selectedNode.actions;
        for (let action of this.actions) {
          if (action.actionType === 'Move') {
            this.moveParameters = action.parameters;
            continue;
            // break;
          }
          if (action.actionType === 'Dock') {
            this.dockParameters = action.parameters;
            continue;
          }
          if (action.actionType === 'Undock') {
            this.undockParameters = action.parameters;
            continue;
          }
        }

        // this.cdRef.detectChanges();
        // Remove selected action from the dropdown options
        let actionOpt = this.selectedNode.actions.map(action => action.actionType);
        this.actionOptions = []
        if(!actionOpt.includes('Move')) this.actionOptions.push({label: 'Move', value: 'Move'})
        if(!actionOpt.includes('Dock')) this.actionOptions.push({label: 'Dock', value: 'Dock'})
        if(!actionOpt.includes('Undock')) this.actionOptions.push({label: 'Undock', value: 'Undock'})

        this.showNodeDetailsPopup();
        return;
      }
    }
    // Check if the click is on an edge
    const clickedEdge = this.edges.find((edge) =>
      this.isPointOnEdge(edge, x, y)
    );
    for (const asset of this.assets) {
      if (this.isAssetClicked(asset, x, y) && asset.type === 'docking') {
        console.log('Docking station clicked');

        this.selectedAsset = asset;
        this.undockingDistance = asset.undockingDistance.toString();
        this.description = asset.desc;
        this.DockPopup = true; // Show the popup for docking stations only
        return; // Exit early after handling docking station
      }
      if (this.isAssetClicked(asset, x, y) && asset.type === 'charging') {
        this.selectedAsset = asset;
        this.isConfirmationVisible = true;
      }
    }
    if (clickedEdge) {
      this.currentEdge = { ...clickedEdge };  // Set the current edge details for editing
      this.originalEdgeDetails = { ...clickedEdge };  // Store the original unmodified edge details
      const distance = this.calculateDistanceBetweenNodes(
        this.currentEdge.startNodeId,
        this.currentEdge.endNodeId
      );
  
      // Assign the distance to the length field if available
      if (distance !== null) {
        this.currentEdge.length = distance;
      } else {
        this.currentEdge.length = 0; // Default to 0 if nodes are not found
      }
      this.showPopup = true;  // Show the popup with form fields
      return;
    }
  }
  onDeleteZone(): void {
    if (this.selectedZone) {
      // Remove the selected zone from the zones array
      this.zones = this.zones.filter((zone) => zone.id !== this.selectedZone?.id);
      this.selectedZone = null;

      // Hide the popup and redraw the canvas to reflect the deletion
      this.isPopupVisible = false;
      this.redrawCanvas();
    }
  }
  validationMessage: string | null = null;

  savePopupData(): void {
    this.validationMessage = null;
    const undockingDistanceNumber = Number(this.undockingDistance);

    // Validate undockingDistance
    if (
      !undockingDistanceNumber ||
      undockingDistanceNumber < 1 ||
      undockingDistanceNumber > 1000
    ) {
      this.validationMessage = 'Undocking Distance must be between 1 and 1000.';
      return;
    }

    // Validate description
    if (!this.description || this.description.trim() === '') {
      this.validationMessage = 'Please enter a description.';
      return;
    }

    // Check for description length
    if (this.description.length > 255) {
      this.validationMessage = 'Description cannot exceed 255 characters.';
      return;
    }

    if (this.selectedAsset) {
      this.assets = this.assets.map((asset) => {
        if (this.selectedAsset?.id === asset.id) {
          asset.undockingDistance = parseInt(this.undockingDistance);
          asset.desc = this.description;
        }
        return asset;
      });
      this.redrawCanvas();
    }

    this.closePopup1();
  }
  closePopup1(): void {
    this.DockPopup = false;
    this.undockingDistance = '';
    this.description = '';
    this.validationMessage=""
    this.selectedAssetId = null;
  }
  showNodeDetailsPopup(): void {
    this.validationError="";
    // Load saved actions for the selected node
    if(this.selectedNode)
      this.actions = [...(this.selectedNode.actions || [])];  // Load node's saved actions or an empty array
    this.isNodeDetailsPopupVisible = true;
    
    // this.cdRef.detectChanges(); // Ensure the popup updates
  }
  private drawNode(node: Node, color: string, selected: boolean): void {
    const canvas = this.overlayCanvas.nativeElement;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const transformedY = canvas.height - node.nodePosition.y; // Flip the Y-axis
      ctx.beginPath();
      ctx.arc(node.nodePosition.x, transformedY, 7, 0, 2 * Math.PI);
      ctx.fillStyle = selected ? color : 'blue';
      ctx.lineWidth = selected ? 3 : 1;
      ctx.fill();

      // Draw the node ID below the node
      ctx.font = '12px Arial'; // Font size and type
      ctx.fillStyle = 'black'; // Text color
      ctx.textAlign = 'center'; // Center align text
      ctx.textBaseline = 'top'; // Position text below the node
      ctx.fillText(node.nodeId, node.nodePosition.x, transformedY + 10); // Draw node ID
    }
  }
  private drawArrowLine(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    maxHeight: number = 50, // Maximum allowed height
    maxWidth: number = 50 // Maximum allowed width
  ): void {
    console.log(startX, startY);

    const canvas = this.overlayCanvas.nativeElement;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Apply the Y-transformation (assuming the transformation inverts the Y-coordinate)
      const canvasHeight = canvas.height;
      const transformedStartY = canvasHeight - startY;
      let transformedEndY = canvasHeight - endY;

      // Calculate the actual height of the line
      let height = Math.abs(transformedEndY - transformedStartY);
      let width = Math.abs(endX - startX);

      // Adjust the endY coordinate if the height exceeds maxHeight
      if (height > maxHeight) {
        const directionY = transformedEndY > transformedStartY ? 1 : -1; // Determine if the line is going up or down
        transformedEndY = transformedStartY + directionY * maxHeight;
      }

      // Adjust the endX coordinate if the width exceeds maxWidth
      if (width > maxWidth) {
        const directionX = endX > startX ? 1 : -1; // Determine if the line is going right or left
        endX = startX + directionX * maxWidth;
      }

      // Recalculate the angle after possible adjustments
      const angleRadians = Math.atan2(
        transformedEndY - transformedStartY,
        endX - startX
      );
      const angleDegrees = angleRadians * (180 / Math.PI);
      // Update the orientationAngle of the node
      const currentNode = this.nodes.find((node) => {
        if (Math.abs(node.nodePosition.x - startX) <= 5)
          node.nodePosition.orientation = angleDegrees;
      });

      this.orientationAngle = angleDegrees;
      if (this.secondNode) this.secondNode.nodePosition.orientation = angleDegrees;
      if (currentNode) {
        currentNode.nodePosition.orientation = angleDegrees;
      }

      // console.log(
      //   `Orientation angle with respect to the X-axis: ${angleDegrees.toFixed(
      //     2
      //   )}°`
      // );

      // Draw the line
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, canvasHeight - transformedEndY); // Use transformedEndY for correct rendering
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw arrowhead
      const arrowLength = 10;
      ctx.beginPath();
      ctx.moveTo(endX, canvasHeight - transformedEndY); // Arrow at the adjusted end point
      ctx.lineTo(
        endX - arrowLength * Math.cos(angleRadians - Math.PI / 6),
        canvasHeight -
          transformedEndY +
          arrowLength * Math.sin(angleRadians - Math.PI / 6)
      );
      ctx.moveTo(endX, canvasHeight - transformedEndY);
      ctx.lineTo(
        endX - arrowLength * Math.cos(angleRadians + Math.PI / 6),
        canvasHeight -
          transformedEndY +
          arrowLength * Math.sin(angleRadians + Math.PI / 6)
      );
      ctx.stroke();
    }
  }
  selectedRobots: any[] = [ /* Selected robot(s) */ ]; // Predefined robot(s) to initialize

  positionToQuaternion(position : any) {
    const angle = position.orientation;  // z contains the rotation angle (in radians)

    // Calculate quaternion for rotation around z-axis
    const quaternion = {
        x: 0,  // No rotation around x-axis
        y: 0,  // No rotation around y-axis
        z: Math.sin(angle / 2),  // Rotation around z-axis
        w: Math.cos(angle / 2)   // Scalar part of the quaternion
    };

    return quaternion;
}
generateRobotId(): string {
  return 'robot_' + (this.robos.length + 1);
}
// Method to initialize the selected robot and log its details
async initializeRobot(): Promise<void> {
  let ratio = this.ratio ? this.ratio : 1;
  let quaternion = { x:0, y:0, z:0, w:1 };
  const transformedY = this.overlayCanvas.nativeElement.height - this.robotToDelete.pos.y;
  this.robotToDelete.pos.x = this.robotToDelete.pos.x * ratio;
  this.robotToDelete.pos.y = transformedY * ratio;

  // quaternion = this.positionToQuaternion(this.robotToDelete.pos);
  let initializeRobo = {
    id : this.robotToDelete.roboDet.id,
    pose:{
      position: {
        x: this.robotToDelete.pos.x,
        y: this.robotToDelete.pos.y,
        z: this.robotToDelete.pos.orientation
        },
      orientation: quaternion
    }
  }

  let response = await fetch(`http://${environment.API_URL}:${environment.PORT}/stream-data/initialize-robot`,{
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mapId : this.selectedMap.id,
      initializeRobo : initializeRobo
    }),
  })
  let data = await response.json();
  console.log(data);
  // this.cancelDelete();
  if(data.isInitialized){
    alert('robo Initialized!');
    return;
  }
  if(data.msg) alert(data.msg)
}

placeRobots(selectedRobots: any[]): void {
  if (!this.overlayCanvas) return;
  const canvas = this.overlayCanvas.nativeElement;
  console.log(selectedRobots,"hey");
  
  selectedRobots.forEach((robot) => {
    let x = 0 + this.roboInitOffset;
    let y = canvas.height - 100;
    const orientation = 90; // Initial orientation

    // Check if the robot is already in the map
    if (this.robos.some((robo) => robo.roboDet.id === robot.id)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Robot already in map!'
      });
      return;
    }

    // Check if the initial position is occupied
    if (this.isPositionOccupied(x, y, 'robot')) {
      // Find a nearby available position
      const spacing = 50; // Spacing distance to move the robot if position is occupied
      let attempts = 0;

      while (this.isPositionOccupied(x, y, 'robot') && attempts < 10) {
        // Try moving the robot to the right by a certain spacing distance
        x += spacing;
        // If x exceeds canvas width, reset x and move y upwards
        if (x > canvas.width) {
          x = 0 + this.roboInitOffset;
          y -= spacing; // Move upwards
        }
        attempts++;
      }
    }
        
   
    // Create and store robot details with the new orientation
    const robo: Robo = {
      roboDet: robot, // Add orientation to roboDet
      pos: { x: x, y: y, orientation } // Store orientation in pos as well
    };
    this.robos.push(robo);
    console.log(this.robos,"robot")
    this.roboInitOffset += 60; // Update offset for next robot placement
    this.plotRobo(x, y, false, orientation); // Pass the orientation to plotRobo
  });
}

plotRobo(x: number, y: number, isSelected: boolean = false, orientation: number = 0): void {
  const image = this.robotImages['robotB'];
  const canvas = this.overlayCanvas.nativeElement;
  const ctx = canvas.getContext('2d');

  if (image && ctx) {
    const imageSize = 20;
    ctx.save(); // Save the current state of the canvas before applying transformations
    // Translate to the robot's position and rotate by the orientation
    ctx.translate(x, y);
    ctx.rotate(orientation); // Rotate by the specified orientation (90 degrees)

    if (!isSelected) {
      ctx.beginPath();
      ctx.arc(0, 0, imageSize * 1, 0, 2 * Math.PI); // Draw a circle centered on the robot
      ctx.fillStyle = 'rgba(255, 0, 0, 0.4)'; // Semi-transparent red
      ctx.fill();
      ctx.closePath();
    }
    // Draw the robot image, which is now rotated
    ctx.drawImage(
      image,
      -imageSize / 2, // Adjust for rotation
      -imageSize / 2,
      imageSize * 1.3,
      imageSize
    );
    ctx.restore(); // Restore the original canvas state
  }
}

  drawText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number
  ): void {
    ctx.font = '12px Arial'; // Set font size and family
    ctx.fillStyle = 'black'; // Set text color
    ctx.textAlign = 'center'; // Center align the text
    ctx.textBaseline = 'top'; // Align text from the top
    ctx.fillText(text, x, y); // Draw text at (x, y)
  }
  private isPositionOccupied(x: number, y: number, type: string): boolean {
    let nodeOccupied = false;
    let assetOccupied = false;

    // Single node or asset placement logic
    if (type !== 'node') {    
      nodeOccupied = this.nodes.some((node) => {          
          const distance = Math.sqrt(Math.pow(node.nodePosition.x - x, 2) + Math.pow(node.nodePosition.y - y, 2));
          return distance < 25; // Threshold for proximity 
      });
    }
  
    if (type !== 'asset') {
      assetOccupied = this.assets.some((asset) => {
        const distance = Math.sqrt(Math.pow(asset.x - x, 2) + Math.pow(asset.y - y, 2));
        return distance < 20; // Threshold for proximity
      });
    }
  
    // Check if any robot is already occupying the position
    const roboOccupied = this.robos.some((robo) => {
      const distance = Math.sqrt(Math.pow(robo.pos.x - x, 2) + Math.pow(robo.pos.y - y, 2));
      return distance < 30; // Threshold for robots proximity
    });
  
    return nodeOccupied || assetOccupied || roboOccupied;
  }
  storeNodestoLocal(){
    if(!this.sessionService.isMapInEdit())return; 
    let mapDetails = this.sessionService.getMapDetails();
    mapDetails.nodes=this.nodes;
    this.sessionService.storeMapDetails(mapDetails);
  }
  storeEdgestoLocal(){
    if(!this.sessionService.isMapInEdit())return; 
    let mapDetails = this.sessionService.getMapDetails();
    mapDetails.edges=this.edges;
    this.sessionService.storeMapDetails(mapDetails);
  }
  
  plotSingleNode(x: number, y: number): void {
    const canvas = this.overlayCanvas.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const transformedY = canvas.height - y; // Flip the Y-axis
    if (this.isPositionOccupied(x, y, 'node')) {
      // alert('This position is already occupied by a node or asset. Please choose a different location.');
      this.messageService.add({
        severity: 'warn',
        summary: 'Please choose different Location',
        detail: 'This position is already occupies by a node or asset.'
      });
      return;
    }
    const color = 'blue'; // Color for single nodes
    this.drawNode(
      {
        nodeId: '',
        sequenceId: 0,
        nodeDescription: '',
        released: true,
        nodePosition: { x: x, y: transformedY, orientation: 0 },
        quaternion:{ x: 0, y: 0,z:0,w:1},
        intermediate_node: false,
        Waiting_node: false,
        charge_node: false,
        dock_node:false,
        actions: [],
      },
      color,
      false
    );

    this.nodeDetails = {
      id: this.nodeCounter,
      x: x * (this.ratio || 1), // Adjust for ratio if present
      y: transformedY * (this.ratio || 1),
      description: '',
      actions: [],
      intermediate_node: false,
      waiting_node: false,
      dock_node:false,
      charge_node:false
    };
    let quaternion=this.ToQuaternion_(0,0,this.orientationAngle);

    let node = {
      nodeId: this.nodeCounter.toString(),
      sequenceId: this.nodeCounter,
      nodeDescription: '',
      released: true,
      nodePosition: { x: x , y:  transformedY , orientation: this.orientationAngle },
      quaternion:quaternion,
      actions: [],
      intermediate_node: false,
      Waiting_node: false,
      charge_node: false,
      dock_node: false
    };

    //{ id: this.nodeCounter.toString(), x, y: transformedY,type: 'single' }
    this.nodes.push(node);
    this.Nodes.push({ ...this.nodeDetails, type: 'single' });
    this.storeNodestoLocal();

    this.nodeCounter++; // Increment the node counter after assignment
    this.isPlottingEnabled = false; // Disable plotting after placing a single node

    this.isDrawingLine = true;
    this.lineStartX = x;
    this.lineStartY = y;

    this.overlayCanvas.nativeElement.addEventListener(
      'mousemove',
      this.onMouseMove.bind(this)
    );
    this.overlayCanvas.nativeElement.addEventListener(
      'mouseup',
      this.onMouseUp.bind(this)
    );

  }

  setPlottingMode(mode: 'single' | 'multi'): void {
    this.plottingMode = mode;
    this.isPlottingEnabled = true;
    this.isMultiNodePlotting = mode === 'multi';
    // this.toggleOptionsMenu();

    if (mode === 'multi') {
      // this.nodes = [];
      this.firstNode = null;
      this.secondNode = null;
    }
  }
  private isMultiNodePlotting: boolean = false;
  isDirectionSelected: boolean = true; // To track if direction is selected

  plotMultiNode(x: number, y: number): void {
    const canvas = this.overlayCanvas.nativeElement;
    const transformedY = canvas.height - y; // Flip the Y-axis

    if (this.isPositionOccupied(x, y, 'node')) {
        // alert('This position is already occupied by a node or asset. Please choose a different location.');
        this.messageService.add({
          severity: 'warn',
          summary: 'Please choose different Location',
          detail: 'This position is already occupies by a node or asset.'
        });
        return;
    }

    const color = 'blue'; // Color for multi-nodes
    this.drawNode(
        {
            nodeId: '',
            sequenceId: 0,
            nodeDescription: '',
            released: true,
            nodePosition: { x: x, y: transformedY, orientation: 0 },
            quaternion:{ x: 0, y: 0,z:0,w:1},
            actions: [],
            intermediate_node: false,
            Waiting_node: false,
            charge_node: false,
            dock_node: false
        },
        color,
        false
    );

    if (this.firstNode === null) {
        // Plotting the first node
        let firstnode = {
            nodeId: this.nodeCounter.toString(),
            sequenceId: this.nodeCounter,
            nodeDescription: '',
            released: true,
            nodePosition: { x: x, y: transformedY, orientation: 0 },
            quaternion:{ x: 0, y: 0,z:0,w:1},
            actions: [],
            intermediate_node: false,
            Waiting_node: false,
            charge_node: false,
            dock_node: false
        };
        this.firstNode = firstnode;
        this.nodes.push(firstnode);
        this.storeNodestoLocal();
    } else if (this.secondNode === null) {
        // Plotting the second node
        let secondnode = {
            nodeId: this.nodeCounter.toString(),
            sequenceId: this.nodeCounter,
            nodeDescription: '',
            released: true,
            nodePosition: { x: x, y: transformedY, orientation: 0 },
            quaternion:{ x: 0, y: 0,z:0,w:1},
            actions: [],
            intermediate_node: false,
            Waiting_node: false,
            charge_node: false,
            dock_node: false
        };
        this.secondNode = secondnode;
        this.currMulNode.push(this.firstNode);
        this.currMulNode.push(this.secondNode);

        this.nodes.push(secondnode);
        this.storeNodestoLocal();

        this.isDrawingLine = true;
        this.lineStartX = x;
        this.lineStartY = y;

        this.overlayCanvas.nativeElement.addEventListener(
            'mousemove',
            this.onMouseMove.bind(this)
        );
        this.overlayCanvas.nativeElement.addEventListener(
            'mouseup',
            this.onMouseUp.bind(this)
        );

        this.isPlottingEnabled = false; // Disable further plotting after two nodes
        this.isMultiNodePlotting = false;
    }
    //yet to uncomment..
    // else {
    //     // Plotting additional nodes
    //     let node = {
    //         nodeId: this.nodeCounter.toString(),
    //         sequenceId: this.nodeCounter,
    //         nodeDescription: '',
    //         released: true,
    //         nodePosition: {
    //             x: x,
    //             y: transformedY,
    //             orientation: this.secondNode.nodePosition.orientation,
    //         },
    //         actions: [],
    //         intermediate_node: false,
    //         Waiting_node: false,
    //     };
    //     this.nodes.push(node);
    // }
    
    this.Nodes.push({ ...this.nodeDetails, type: 'multi' });
    this.nodeCounter++; // Increment the node counter
  }
  onInputChanged(): void {
    this.isEnterButtonVisible =
      this.numberOfIntermediateNodes !== null &&
      this.numberOfIntermediateNodes >0;
  }
  plotIntermediateNodes(): void {
    if (!this.direction) {
      this.isDirectionSelected = false; // Show validation message
      return; // Do not proceed if direction is not selected
    } else {
        this.isDirectionSelected = true; // Reset validation flag
    }
    if (this.numberOfIntermediateNodes && this.numberOfIntermediateNodes > 0) {
      if (this.firstNode && this.secondNode && this.numberOfIntermediateNodes > 0) {
        let quaternion=this.ToQuaternion_(0,0,this.secondNode!.nodePosition.orientation);
        this.nodes=this.nodes.map((node)=>{
          if(node.nodeId===this.firstNode?.nodeId){
            node.nodePosition.orientation=this.secondNode!.nodePosition.orientation;
            node.quaternion=quaternion;
          }
          return node;
        }
        )
        const dx = (this.secondNode.nodePosition.x - this.firstNode.nodePosition.x) / (this.numberOfIntermediateNodes + 1);
        const dy = (this.secondNode.nodePosition.y - this.firstNode.nodePosition.y) / (this.numberOfIntermediateNodes + 1);

        for (let i = 1; i <= this.numberOfIntermediateNodes; i++) {
          const x = this.firstNode.nodePosition.x + i * dx;
          const y = this.firstNode.nodePosition.y + i * dy;
          const transformedY = this.overlayCanvas.nativeElement.height - y; // Flip the Y-axis

          if(this.isPositionOccupied(x, transformedY, 'node')){
            // alert('Nodes cannot plotted as there are nodes or assets are between them');
            this.messageService.add({
              severity: 'warn',
              summary: 'Warning',
              detail: 'Nodes Cannot plotted as there are nodes or assets are between them'
            });
            this.nodes = this.nodes.filter(node =>
              !this.currMulNode.some(mulNode => mulNode.nodeId === node.nodeId)
            );
            this.closeIntermediateNodesDialog();
            this.redrawCanvas();
            return;
          }
          if(this.isOverLappingWithOtherNodesInPlotting(x, y)){
            // alert('Nodes cannot plotted as there are nodes or assets are between them');
            this.messageService.add({
              severity: 'warn',
              summary: 'Warning',
              detail: 'Nodes cannot plotted as there are nodes or assets are between them.'
            });
            this.nodes = this.nodes.filter(node =>
              !this.currMulNode.some(mulNode => mulNode.nodeId === node.nodeId)
            );
            this.closeIntermediateNodesDialog()
            this.redrawCanvas();
            return;
          }
          // let quaternion=this.ToQuaternion_(0,0,this.secondNode!.nodePosition.orientation);
          let node = {
            nodeId: this.nodeCounter.toString(),
            sequenceId: this.nodeCounter,
            nodeDescription: 'Intermediate Node',
            released: true,
            nodePosition: { x: x, y: y, orientation: this.secondNode!.nodePosition.orientation },
            quaternion:quaternion,
            actions: [],
            intermediate_node: true, // Marking it as intermediate
            Waiting_node: false,
            charge_node: false,
            dock_node: false
          };

          this.nodes.push(node);
          this.currMulNode.push(node);
          

          // Draw the node
          this.drawNode(node, 'blue', false);

          // Draw the text label for the node
          const canvas = this.overlayCanvas.nativeElement;
          const ctx = canvas.getContext('2d')!;

          console.log(`Intermediate Node ${this.nodeCounter} plotted at:`, { x, y });

          this.Nodes.push({ ...this.nodeDetails, type: 'multi' });

          this.nodeCounter++; // Increment the node counter
        }
        this.storeNodestoLocal();
      }
      this.plotMulNodesEdges()// call here..
      this.closeIntermediateNodesDialog();
    }
  }

  plotMulNodesEdges(){
    if (this.currMulNode.length >= 2) {
      let secondValue = this.currMulNode[1];
      this.currMulNode.splice(1, 1);
      this.currMulNode.push(secondValue);
    }
    let arr = this.currMulNode;
    for(let i = 0; i < arr.length-1; i++){
      let edge : Edge;

      // console.log(this.currMulNode);
      edge = {
        edgeId: this.edgeCounter.toString(),
        sequenceId: this.edgeCounter,
        edgeDescription: '',
        released: false,
        startNodeId: arr[i].nodeId,
        endNodeId: arr[i+1].nodeId,
        maxSpeed: 0,
        maxHeight: 0,
        minHeight: 0,
        orientation: 0,
        orientationType: '',
        direction: this.direction == 'bi' ? 'BI_DIRECTIONAL' : 'UN_DIRECTIONAL',
        rotationAllowed: false,
        maxRotationSpeed: 0,
        length: 0,
        action: [],
      };
      this.edges.push(edge);
      this.storeEdgestoLocal();
      this.edgeCounter++;
      // this.drawEdge( arr[i].nodePosition, arr[i+1].nodePosition, this.direction!, arr[i].nodeId, arr[i+1].nodeId );
    }
    this.resetSelection();
    this.direction = ''; // yet to take..
    this.redrawCanvas();
  }
  // Define the available actions for the dropdown
  actionOptions = [...this.allActions];
  // Validation logic
  validateForm() {
    if (!this.nodeDetails.description) {
      this.validationError = 'Node Description is required.';
    } else if (this.selectedAction === 'Move') {
      if (!this.moveParameters.maxLinearVelocity || !this.moveParameters.maxAngularVelocity) {
        this.validationError = 'All Move Action fields are required.';
      } else {
        this.validationError = null; // Clear error if all fields are valid
      }
    } else if (this.selectedAction === 'Dock') {
      if (!this.dockParameters.maxAngularVelocity || !this.dockParameters.goalOffsetX) {
        this.validationError = 'All Dock Action fields are required.';
      } else {
        this.validationError = null;
      }
    } else if (this.selectedAction === 'Undock') {
      if (!this.undockParameters.maxLinearVelocity || !this.undockParameters.maxToleranceAtGoalX) {
        this.validationError = 'All Undock Action fields are required.';
      } else {
        this.validationError = null;
      }
    }
  }
  // validationError: string = '';

  get nodePositionX(): number {
    if (this.selectedNode?.nodePosition && this.ratio) {
      const calculatedX = this.selectedNode.nodePosition.x * this.ratio - this.origin.x;
      return parseFloat(calculatedX.toFixed(3));
    }
    return this.selectedNode?.nodePosition?.x ?? 0;
  }
  
  set nodePositionX(value: number) {
    // console.log(this.ratio);
    
    if (this.selectedNode?.nodePosition && this.ratio) {
      console.log(this.ratio,value,this.origin.x);
      
      // Reverse the transformation and update the node position
      this.selectedNode.nodePosition.x = (value / this.ratio) - this.origin.x;
      console.log("hey",this.selectedNode.nodePosition.x);
      
    }
  
  }
  
  get nodePositionY(): number {
    if (this.selectedNode?.nodePosition && this.ratio) {
      const calculatedY = this.selectedNode.nodePosition.y * this.ratio - this.origin.y;
      return parseFloat(calculatedY.toFixed(3));
    }
    return this.selectedNode?.nodePosition?.y ?? 0;
  }
  
  set nodePositionY(value: number) {
    if (this.selectedNode?.nodePosition ) {
      // Reverse the transformation and update the node position
      this.selectedNode.nodePosition.y = (value / this.ratio!) - this.origin.y;
    }
  }
  
  get orientation(): number {
    return parseFloat((this.selectedNode?.nodePosition?.orientation ?? 0).toFixed(3));
  }
  
  set orientation(value: number) {
    if (this.selectedNode?.nodePosition) {
      this.selectedNode.nodePosition.orientation = value;
    }
  }
  
  closeIntermediateNodesDialog(): void {
    this.showIntermediateNodesDialog = false;
    this.firstNode = null;
    this.secondNode = null;
    this.numberOfIntermediateNodes = null;
    this.currMulNode = [];
    this.onInputChanged ();
  }
  private onNodeClick(x: number, y: number): void {
    // Find the clicked node
    let clickedNode: Node | undefined;
    clickedNode = this.nodes.find(
      (node) => node.nodePosition.x === x && node.nodePosition.y === y
    );

    if (clickedNode) {
      if (!this.firstNode) {
        this.firstNode = clickedNode;
        this.drawNode(clickedNode, 'red', true); // Highlight the first node
      } else if (!this.secondNode) {
        this.secondNode = clickedNode;
        this.drawNode(clickedNode, 'red', true); // Highlight the second node

        // Check if the edge between the selected nodes already exists
        const existingEdge = this.edges.find(
          (edge) => {
            let cond1 = edge.startNodeId === this.firstNode?.nodeId && edge.endNodeId === this.secondNode?.nodeId;
            let cond2 = edge.startNodeId === this.secondNode?.nodeId && edge.endNodeId === this.firstNode?.nodeId;
            return cond1 || cond2;
          }
        );

        // If the edge already exists in the same direction, show alert
        // if (existingEdge) alert('Edge already exists!');

        if(!existingEdge){
          // If no existing edge, proceed to draw
          if (this.direction === 'uni') {
            let edge: Edge;
            edge = {
              edgeId: this.edgeCounter.toString(),
              sequenceId: this.edgeCounter,
              edgeDescription: '',
              released: false,
              startNodeId: this.firstNode.nodeId,
              endNodeId: this.secondNode.nodeId,
              maxSpeed: 0,
              maxHeight: 0,
              minHeight: 0,
              orientation: 0,
              orientationType: '',
              direction: 'UN_DIRECTIONAL',
              rotationAllowed: false,
              maxRotationSpeed: 0,
              length: 0,
              action: [],
            };
            this.edges.push(edge);
            this.storeEdgestoLocal();
            this.drawEdge(
              this.firstNode.nodePosition,
              this.secondNode.nodePosition,
              'uni',
              this.firstNode.nodeId,
              this.secondNode.nodeId
            );
          } else if (this.direction === 'bi') {
            let edge: Edge;
            edge = {
              edgeId: this.edgeCounter.toString(),
              sequenceId: this.edgeCounter,
              edgeDescription: '',
              released: false,
              startNodeId: this.firstNode.nodeId,
              endNodeId: this.secondNode.nodeId,
              maxSpeed: 0,
              maxHeight: 0,
              minHeight: 0,
              orientation: 0,
              orientationType: '',
              direction: 'BI_DIRECTIONAL',
              rotationAllowed: false,
              maxRotationSpeed: 0,
              length: 0,
              action: [],
            };
            this.edges.push(edge);
            this.storeEdgestoLocal();
            this.drawEdge(
              this.firstNode.nodePosition,
              this.secondNode.nodePosition,
              'bi',
              this.firstNode.nodeId,
              this.secondNode.nodeId
            );
          }

          this.edgeCounter++;
          this.isEdgeDrawingInProgress = false;
        }

        // Reset after drawing
        this.resetSelection();
      }

      if (this.selectedNode === clickedNode) {
        // If the same node is clicked again, deselect it
        this.deselectNode();
        console.log('Node deselected:', x, y);
      } else {
        // If a different node is clicked, deselect the previous one if any
        if (this.selectedNode) {
          this.deselectNode();
        }
        // Select the new node
        this.selectedNode = clickedNode;
        this.drawNode(clickedNode, 'red', true); // Highlight the selected node
        console.log('Node selected:', x, y);

        // Draw connections or perform any other actions
        if (this.lastSelectedNode) {
          this.drawConnections();
          this.resetSelection(); // Reset for the next connection
        }
      }
    }
  }
  private drawEdge(
    startPos: { x: number; y: number },
    endPos: { x: number; y: number },
    direction: string,
    startNodeId: string,
    endNodeId: string,
    nodeRadius: number = 10, // Define a radius or threshold value for nodes
    threshold: number = 5   // Define a padding/threshold for the line
  ): void {
    const canvas = this.overlayCanvas.nativeElement;
    const ctx = canvas.getContext('2d');

    // Find the corresponding Edge based on startNodeId and endNodeId
    const edge = this.edges.find(
      (e) => e.startNodeId === startNodeId && e.endNodeId === endNodeId
    );

    if (ctx && edge) {
      // Calculate the distance between the start and end points
      const dx = endPos.x - startPos.x;
      const dy = endPos.y - startPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Calculate new start and end points with the threshold
      const startX = startPos.x + (dx * threshold) / distance;
      const startY = startPos.y + (dy * threshold) / distance;
      const endX = endPos.x - (dx * threshold) / distance;
      const endY = endPos.y - (dy * threshold) / distance;

      ctx.beginPath();
      ctx.moveTo(startX, canvas.height - startY); // Start point (flip Y-axis)
      ctx.lineTo(endX, canvas.height - endY); // End point (flip Y-axis)

      // Change color based on direction
      if (direction === 'uni') {
        ctx.strokeStyle = 'black'; // Uni-directional in black
      } else if (direction === 'bi') {
        ctx.strokeStyle = 'green'; // Bi-directional in green
      }
      ctx.lineWidth = 2;
      ctx.stroke();

      this.drawArrowhead(ctx, { x: startX, y: startY }, { x: endX, y: endY }, direction);

      if (direction === 'bi') {
        // Draw the reverse arrow for bi-directional
        this.drawArrowhead(ctx, { x: endX, y: endY }, { x: startX, y: startY }, direction);
      }

      // Draw edge ID in the middle of the line
      const midX = (startX + endX) / 2;
      const midY = (canvas.height - startY + canvas.height - endY) / 2;

      ctx.font = '12px Arial'; // Font size and type
      ctx.fillStyle = 'black'; // Text color
      ctx.textAlign = 'center'; // Center align text
      ctx.textBaseline = 'top'; // Position text below the edge

      // Draw the edge ID instead of startNodeId and endNodeId
      ctx.fillText(`${edge.edgeId}`, midX, midY + 5);
    }
  }
  private drawArrowhead(
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    direction: string
  ): void {
    const headLength = 15; // Length of the arrowhead
    const offset = 0; // Distance to move the arrowhead away from the node
    const angle = Math.atan2(to.y - from.y, to.x - from.x);

    // Calculate the offset position for the arrowhead
    const offsetX = offset * Math.cos(angle);
    const offsetY = offset * Math.sin(angle);

    // Adjust the end position of the arrowhead by the offset
    const adjustedToX = to.x - offsetX;
    const adjustedToY = to.y - offsetY;

    ctx.beginPath();
    ctx.moveTo(
      adjustedToX,
      this.overlayCanvas.nativeElement.height - adjustedToY
    );
    ctx.lineTo(
      adjustedToX - headLength * Math.cos(angle - Math.PI / 6),
      this.overlayCanvas.nativeElement.height -
        (adjustedToY - headLength * Math.sin(angle - Math.PI / 6))
    );
    ctx.lineTo(
      adjustedToX - headLength * Math.cos(angle + Math.PI / 6),
      this.overlayCanvas.nativeElement.height -
        (adjustedToY - headLength * Math.sin(angle + Math.PI / 6))
    );
    ctx.lineTo(
      adjustedToX,
      this.overlayCanvas.nativeElement.height - adjustedToY
    );

    // Change arrowhead color based on direction
    if (direction === 'uni') {
      ctx.fillStyle = 'black'; // Uni-directional arrowhead in black
    } else if (direction === 'bi') {
      ctx.fillStyle = 'green'; // Bi-directional arrowhead in green
    }

    ctx.fill();
  }
  showEdgeError = false;

  resetSelection(): void {
    this.firstNode = null;
    this.secondNode = null;
    this.direction = "";
    this.selectedNodeId = '';  // Reset the selected node ID
  }
  private deselectNode(): void {
    if (this.selectedNode) {
      // Redraw the previously selected node as deselected (transparent or default color)
      this.drawNode(this.selectedNode, 'blue', false); // Using 'blue' for non-selected nodes
      this.selectedNode = null;
    }
  }
  private isNodeClicked(node: Node, mouseX: number, mouseY: number): boolean {
    const radius = 6; // Node radius
    const canvas = this.overlayCanvas.nativeElement;
    const transformedY = canvas.height - node.nodePosition.y; // Flip the Y-axis for node.y

    const dx = mouseX - node.nodePosition.x;
    const dy = mouseY - transformedY; // Use transformed Y-coordinate
    return dx * dx + dy * dy <= radius * radius;
  }

  private plotAsset(x: number, y: number, assetType: string): void {

    const canvas = this.overlayCanvas.nativeElement;
    const ctx = this.overlayCanvas.nativeElement.getContext('2d');
    const image = this.assetImages[assetType];
    const transformedY = canvas.height - y; // Flip the Y-axis
    

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

    // Update assets list and asset details
    this.assets = this.assets.map((asset) => {
      if (this.selectedAsset?.id === asset.id)
        asset.orientation = this.orientationAngle;
      return asset;
    });
    this.overlayCanvas.nativeElement.addEventListener(
      'mousemove',
      this.onMouseMove.bind(this)
    );
    this.overlayCanvas.nativeElement.addEventListener(
      'mouseup',
      this.onMouseUp.bind(this)
    );
    this.isPlottingAsset = false;
  }
  isDeleteVisible = true;
  startZonePlotting(): void {
    this.toggleOptionsMenu();
    this.isZonePlottingEnabled = true;
    this.plottedPoints = []; // Reset previously plotted points
    this.zonePointCount = 0; // Reset the point count for each new zone plotting session
    this.isDeleteVisible = false;
  }
  plotZonePoint(x: number, y: number, isFirstPoint: boolean): void {
    const canvas = this.overlayCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw outer stroke
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.strokeStyle = isFirstPoint ? 'blue' : 'red'; // Violet for the first point, red for others
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw inner circle
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = isFirstPoint ? 'blue' : 'red'; // Violet for the first point, red for others
      ctx.fill();
      
    } else {
      console.error('Failed to get canvas context');
    }
  }
  private isPointTooClose(
    x: number,
    y: number,
    existingPoints: any[],
    threshold: number = 6
  ): boolean {
    return existingPoints.some((point) => {
      const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
      return distance < threshold;
    });
  }
  private lastDrawnZone: { type: string; points: any[] } | null = null;
  drawLayer(): void {
    const canvas = this.overlayCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
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
  private isZoneOverlapping(newZonePoints: any[]): boolean {
    for (const existingZone of this.zones) {
      if (
        this.isPolygonOverlap(existingZone.pos, newZonePoints) &&
        this.selectedZone?.id !== existingZone.id
      ) {
        return true;
      }
    }
    return false;
  }
  private isPolygonOverlap(polygon1: any[], polygon2: any[]): boolean {
    return (
      this.satCheck(polygon1, polygon2) && this.satCheck(polygon2, polygon1)
    );
  }
  private satCheck(polygon1: any[], polygon2: any[]): boolean {
    for (let i = 0; i < polygon1.length; i++) {
      // Get the edge from the current vertex to the next
      const p1 = polygon1[i];
      const p2 = polygon1[(i + 1) % polygon1.length];

      // Calculate the normal (perpendicular) to the edge
      const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
      const normal = { x: -edge.y, y: edge.x };

      // Project both polygons onto the normal axis
      const projection1 = this.projectPolygon(polygon1, normal);
      const projection2 = this.projectPolygon(polygon2, normal);

      // Check for overlap on this axis
      if (
        projection1.max < projection2.min ||
        projection2.max < projection1.min
      ) {
        // No overlap on this axis, so polygons do not intersect
        return false;
      }
    }
    // No separating axis found, polygons intersect
    return true;
  }
  private projectPolygon(polygon: any[], axis: { x: number; y: number }): { min: number; max: number } {
    if (!polygon || polygon.length === 0) {
      // console.error("Invalid polygon data");
      return { min: 0, max: 0 };
    }

    let min = polygon[0]?.x * axis.x + polygon[0]?.y * axis.y;
    let max = min;

    for (let i = 1; i < polygon.length; i++) {
      if (!polygon[i] || polygon[i].x === undefined || polygon[i].y === undefined) {
        console.error("Invalid polygon point:", polygon[i]);
        continue;  // Skip invalid points
      }

      const projection = polygon[i].x * axis.x + polygon[i].y * axis.y;
      if (projection < min) {
        min = projection;
      }
      if (projection > max) {
        max = projection;
      }
    }

    return { min, max };
  }
  private getBoundingBox(polygon: any[]): number[] {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const point of polygon) {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    }

    return [minX, minY, maxX, maxY];
  }
  onZoneTypeSelected(zoneType: ZoneType): void {

    this.zoneType = zoneType;

    if (this.isZoneOverlapping(this.plottedPoints)) {
      // alert('Zone overlaps with an existing zone!');
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Zone overlaps with an existing zone!.'
      });
      return; // Do not allow drawing
    }
    else{
      this.messageService.add({
        severity: 'info',
        summary: 'information on zone',
        detail: `${this.zoneType} is plotted`
      });
    }

    if (this.selectedZone) {
      // Update the zone's type if a zone is selected
      this.selectedZone.type = zoneType;
    } else {
      // Create a new zone if no zone is selected
      let zone: Zone;
      zone = {
        id: this.zoneCounter.toString(),
        pos: this.plottedPoints,
        type: this.zoneType,
      };
      this.zones.push(zone);
      this.zoneCounter++;
    }

    this.isPopupVisible = false; // Hide the popup
    this.redrawCanvas(); // Redraw the canvas to reflect the updated zone
    this.selectedZone = null;
  }
  isRobotClicked(robo: Robo, x: number, y: number): boolean {
    const imageSize = 30;
    const roboX = robo.pos.x;
    const roboY = robo.pos.y;

    // Check if the click is within the robot's bounds (circle radius check)
    const distance = Math.sqrt((x - roboX) ** 2 + (y - roboY) ** 2);
    return distance <= imageSize * 1.5; // Adjust this based on the robot's size
  }
  onCancel(): void {
    // Clear the plotted points and reset the zone plotting state
    this.plottedPoints = [];
    this.isZonePlottingEnabled = false;
    this.isPopupVisible = false;
    this.firstPlottedPoint = null;
    // Redraw the canvas to remove the temporary zone points
    this.redrawCanvas();
  }
  openRobotPopup(): void {
    this.isRobotPopupVisible = true;
  }
  // removeRobots(): void {
  //   // Check if there are any robots to remove
  //   if (this.robos.length === 0) {
  //     console.log("No robots to remove.");
  //     return; // Exit the function if no robots are present
  //   }

  //   // If robots are present, show the confirmation
  //   this.isConfirmationVisible = true;

  //   // If confirmed, proceed with removing the selected robots
  //   // Uncomment and modify based on your confirmation logic
  //   // this.robos = this.robos.filter(
  //   //   (robo) => robo.roboDet.id !== this.selectedRobo?.roboDet.id
  //   // );

  //   // Redraw the canvas after removing robots
  //   // this.redrawCanvas();
  // }
  showZoneTypePopup(): void {
    this.zoneType = null;
    this.isPopupVisible = true;
  }
  closeRobotPopup(): void {
    this.isRobotPopupVisible = false;
  }
  private originalZonePointPosition: { x: number; y: number } | null = null;
  // Helper function to check if a node overlaps with another node or asset
  drawSelectionBox(start: { x: number, y: number }, end: { x: number, y: number }): void {
    const ctx = this.overlayCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    // Set the style for the selection box
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Create dashed lines

    // Draw the selection rectangle
    ctx.strokeRect(minX, minY, width, height);
    ctx.setLineDash([]); // Reset line dash after drawing
  }
  isOverlappingWithOtherRobos(currentRobo: Robo): boolean {
    const threshold = 30; // Adjust this value as needed for the distance to consider as overlap
    for (const robo of this.robos) {
      if (robo.roboDet.id !== currentRobo.roboDet.id) {
        const distance = Math.sqrt(Math.pow(robo.pos.x - currentRobo.pos.x, 2) + Math.pow(robo.pos.y - currentRobo.pos.y, 2));
        if (distance < threshold) {
          return true; // Overlap found
        }
      }
    }
    return false; // No overlap
  }
  isOverlappingwithOtherAssets(currAsset: asset):boolean{
    let threshold = 30; // Adjust this value as needed for the precisson..
    for (const asset of this.assets) {
      if (asset.id !== currAsset.id) {
        const distance = Math.sqrt(Math.pow(asset.x - currAsset.x, 2) + Math.pow(asset.y - currAsset.y, 2));
        if (distance < threshold) {
          return true; // Overlap found
        }
      }
    }
    return false; // No overlap
  }
  isOverLappingWithOtherNodes(currNode : Node):boolean{
    const threshold = 15;
    for (const node of this.nodes) {
      if (node.nodeId !== currNode.nodeId) {
        const distance = Math.sqrt(Math.pow(node.nodePosition.x - currNode.nodePosition.x, 2) + Math.pow(node.nodePosition.y - currNode.nodePosition.y, 2));
        if (distance < threshold) {
          return true;
        }
      }
    }
    return false;
  }
  isOverLappingWithOtherNodesInPlotting(currNodex : number, currNodey : number):boolean{
    const threshold = 15;
    for (const node of this.nodes) {
      // if (node.nodeId !== currNode.nodeId) {
        const distance = Math.sqrt(Math.pow(node.nodePosition.x - currNodex, 2) + Math.pow(node.nodePosition.y - currNodey, 2));
        if (distance < threshold) {
          return true;
        }
      // }
    }
    return false;
  }
  originalRoboPosition: { x: number; y: number } | null = null;
  originalAssetPosition: { x : number; y: number } | null = null;
  originalNodePosition: { x : number; y: number } | null = null;
  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) {
      return; // Do nothing if it's not a left mouse button click
    }
    if (this.overlayCanvas && this.overlayCanvas.nativeElement) {
      const rect = this.overlayCanvas.nativeElement.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (this.overlayCanvas.nativeElement.width / rect.width);
      const y = (event.clientY - rect.top) * (this.overlayCanvas.nativeElement.height / rect.height);
      const transformedY = this.overlayCanvas.nativeElement.height - y;

      if (this.isDeleteModeEnabled) {
        // Start drawing the selection box
        this.selectionStart = { x, y };
        this.selectionTransformStart = {x , y :transformedY}
        this.selectionEnd = null;
      }

      if (this.isZonePlottingEnabled) {
        // Plot the point
        if (this.firstPlottedPoint) {
          let radius = 9;
          if (
            Math.abs(x - this.firstPlottedPoint.x) <= radius &&
            Math.abs(y - this.firstPlottedPoint.y) <= radius
          ) {
            if (this.plottedPoints.length < 3) {
              // alert('should at least minimum 3 zone points to plot!');
              this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Should atleast minimum 3 zone points to plot!.'
              });
              return;
            }
            this.isZonePlottingEnabled = false;
            this.showZoneTypePopup(); // Show zone type popup after completing the polygon
            this.firstPlottedPoint = null;
            return;
          }
        }
        const isFirstPoint = this.plottedPoints.length === 0;
        this.plotZonePoint(x, y, isFirstPoint); // Provide isFirstPoint argument
        // Add the point to the array of plotted points
        this.plottedPoints.push({ id: this.zonePosCounter, x, y });
        this.zonePosCounter++;
        // this.plottedPoints[0];
        if (this.firstPlottedPoint === null)
          this.firstPlottedPoint = { id: this.zonePosCounter, x, y };
        // If six points are plotted, form the layer (polygon)
        // if (this.plottedPoints.length >= this.maxZonePoints) {  //
      }

      if (this.selectedAssetType) {
              // Prevent plotting if the position is occupied
      if (this.isPositionOccupied(x, y, 'asset')) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Position Occupied',
          detail: 'Cannot place an asset at an occupied position.'
        });
        return; // Exit early if position is occupied
      }

        let asset: asset;
        asset = {
          id: this.assetCounter,
          x: x,
          y: y,
          type: this.selectedAssetType,
          orientation: 0,
          undockingDistance: 0,
          desc: '',
        };
        let removeAsset = false;
      for (const node of this.nodes) {
        // Check if the asset is too close to the node
        if (Math.abs(node.nodePosition.x - x) <= 10) {
          console.log("hey"); // Log for debugging
          removeAsset = true; // Mark the asset for removal
          break; // Exit the loop early if a node is found too close
        }
      }

      // If the asset is marked for removal, do not plot it and clear selected asset
      if (removeAsset) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Asset Not Plotted',
          detail: 'The asset cannot be plotted too close to a node, place it on any other place.'
        });
        return; // Exit early to prevent further processing
      }
        this.selectedAsset = asset;
        this.assets.push(asset);

        this.plotAsset(x, y, this.selectedAssetType);
        if (this.selectedAssetType === 'docking') {
          this.isDrawingLine = true; //..
          this.lineStartX = x;
          this.lineStartY = y;
        }
        this.selectedAssetType = null; // Reset after plotting
        this.assetCounter++;
        return;
      }

      // Check if an asset is clicked for dragging
      for (const asset of this.assets) {
        // assuming `this.assets` is an array holding your plotted assets
        if (this.isAssetClicked(asset, x, y)) {
          this.selectedAsset = asset;
          this.originalAssetPosition = {x : asset.x, y : asset.y};
          this.draggingAsset = true;
          break;
        }
      }
      for (const zone of this.zones) {
        for (const point of zone.pos) {
          const radius = 6; // Same as the point's radius
          if ( Math.abs(x - point.x) <= radius && Math.abs(y - point.y) <= radius ) {
            this.selectedZone = zone;
            this.selectedZonePoint = point;
            this.originalZonePointPosition = { x: point.x, y: point.y };
            this.draggingZonePoint = true;
            return; // Exit early if zone point is clicked
          }
        }
      }
      let robotClicked = false; // Track if the robot was clicked
      // Check if a robot is clicked
      for (const robo of this.robos) {
        
        if (this.isRobotClicked(robo, x, y)) {
          this.selectedRobo = robo;
          this.draggingRobo = true;
          this.originalRoboPosition = { x: robo.pos.x, y: robo.pos.y };
          this.redrawCanvas(); // Redraw the canvas after selecting the robot
          robotClicked = true;
          break;
        }
      }

      if (!robotClicked) {
        // Deselect the robot if clicked elsewhere on the canvas
        this.selectedRobo = null;
        // this.redrawCanvas()x; // Redraw the canvas after deselecting the robot
      }

      // Handle other types of clicks like zone plotting, asset dragging, etc.

    // Check if the first node is clicked
    if (this.firstNode && this.isNodeClicked(this.firstNode, x, y) && this.isMultiNodePlotting) {
      // Remove the first node and reset plotting state
      const index = this.nodes.indexOf(this.firstNode);
      if (index > -1) {
        this.nodes.splice(index, 1); // Remove the first node from the nodes array
      }
      this.firstNode = null; // Reset first node
      this.redrawCanvas();
      this.isPlottingEnabled = false; // Re-enable plotting
      this.isMultiNodePlotting = false; // Keep multi-node plotting enabled
      this.messageService.add({
        severity: 'info',
        summary: 'First Node Removed',
        detail: 'The first node has been removed. You can plot again.'
      });
      return; // Exit the method to prevent further processing
    }
      let nodeClicked = false;
      for (const node of this.nodes) {

        if (this.isNodeClicked(node, x, y)) {
          // console.log(node)
          
          if (this.isMultiNodePlotting) {
          this.isPlottingEnabled = false; // Disable further plotting
          this.isMultiNodePlotting = false; // Disable multi-node plotting mode
          this.messageService.add({
            severity: 'info',
            summary: 'Multi-Node Plotting Disabled',
            detail: 'You cannot plot more nodes while another node is selected.'
          });
        }
          this.onNodeClick(node.nodePosition.x, node.nodePosition.y);
          this.selectedNode = node;
          this.originalNodePosition = { x : node.nodePosition.x, y : node.nodePosition.y };
          this.draggingNode = true;
          nodeClicked = true;
          break;
        }
      }

      if (!nodeClicked && this.isPlottingEnabled) {
        if (this.plottingMode === 'single') {
          this.selectedAsset = null;
          this.plotSingleNode(x, y);
        }
        if (this.plottingMode === 'multi') {
          this.selectedAsset = null;
          this.plotMultiNode(x, y);
        }
      }
    }
  }
  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const tooltip = this.pixTooltip.nativeElement;
    if (!tooltip) {
      console.warn('Tooltip element not found');
      return;
    }
    const canvas = this.overlayCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    const transformedY = canvas.height - y; // yet to remove..

    const tooltipX =(x * this.ratio!) - this.origin.x;
    const tooltipY = (transformedY * this.ratio!) - this.origin.y;  
  
    tooltip.innerHTML = `X: ${tooltipX},    Y: ${tooltipY}`;
    tooltip.style.display = 'block';
    tooltip.style.left = `${event.clientX}`; // Position with padding
    tooltip.style.top = `${event.clientY}`; // Adjust to position above cursor

    // console.log(`X = ${(Math.round(x) * this.ratio! ) + this.origin.x}, Y = ${ (Math.round(transformedY) * this.ratio!) + this.origin.y }`);
    if (this.isDeleteModeEnabled && this.selectionStart) {
      this.selectionEnd = { x, y };

      this.redrawCanvas();
      this.drawSelectionBox(this.selectionStart, this.selectionEnd);
      // Redraw canvas with selection box
    }
    if (this.draggingAsset && this.selectedAsset) {
      // Update the position of the selected asset
      this.redrawCanvas();
      this.plotAsset(x, y, this.selectedAsset.type); // Draw the asset at the new position
      // this.selectedAsset = { x, y, type: this.selectedAsset.type }; // Update position
      this.selectedAsset.x = x;
      this.selectedAsset.y = y;
    }

    if (this.draggingZonePoint && this.selectedZonePoint && this.selectedZone) {
      if (this.isPointTooClose(x, y, this.plottedPoints)) {
        // Optionally show an alert or message
        console.warn('The point is too close to an existing zone point');
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'The point is too close to an existing zone point.'
        });
        return;
      }

      // if (this.isZoneOverlapping(this.selectedZone.pos)) {
      //   this.draggingZonePoint = false;

      //   this.selectedZonePoint.x = this.originalZonePointPosition?.x ? this.originalZonePointPosition?.x : x;
      //   this.selectedZonePoint.y = this.originalZonePointPosition?.y ? this.originalZonePointPosition?.y : y;
      //   alert('Zone point overlaps with another zone!');
      //   // this.selectedZonePoint = null;
      //   this.redrawCanvas();
      //   return;
      // }

      // Update the position of the selected zone point
      this.selectedZonePoint.x = x;
      this.selectedZonePoint.y = y;
      this.redrawCanvas(); // Redraw the canvas to reflect the updated position
      return;
    }

    if (this.draggingNode && this.selectedNode) {
      this.selectedNode.nodePosition.x = x;
      this.selectedNode.nodePosition.y = transformedY;
      this.redrawCanvas();
    }

    if (this.isDrawingLine) {
      this.lineEndX = (event.clientX - rect.left) * (canvas.width / rect.width);
      this.lineEndY =
        (event.clientY - rect.top) * (canvas.height / rect.height);

      // Redraw the canvas to show the line preview
      this.redrawCanvas();
      if (this.lineStartX !== null && this.lineStartY !== null) {
        this.drawArrowLine(
          this.lineStartX,
          this.lineStartY,
          this.lineEndX,
          this.lineEndY
        );
      }
    }

    if (this.draggingRobo && this.selectedRobo) {
      this.redrawCanvas();
      this.plotRobo(x, y);

      this.selectedRobo.pos.x = x;
      this.selectedRobo.pos.y = y;
      const roboIndex = this.robos.findIndex(robo => robo.roboDet === this.selectedRobo?.roboDet);
      if (roboIndex !== -1) {
        this.robos[roboIndex].pos.x = x;
        this.robos[roboIndex].pos.y = y;
      }
    }
    canvas.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none'; // Hide tooltip when mouse leaves canvas
    });
  }
  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    const canvas = this.overlayCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    const transformedY = canvas.height - y;

    if (this.isDeleteModeEnabled && this.selectionStart && this.selectionEnd && this.selectionTransformStart) {

      // Calculate selection box bounds
      const minX = Math.min(this.selectionStart.x, this.selectionEnd.x);
      const maxX = Math.max(this.selectionStart.x, this.selectionEnd.x);
      const minY = Math.min(this.selectionTransformStart.y, transformedY);
      const maxY = Math.max(this.selectionTransformStart.y, transformedY);

      // Find nodes inside the selection box
      this.nodesToDelete = this.nodes.filter((node) => {
        const nodeX = node.nodePosition.x;
        const nodeY = node.nodePosition.y;
        const radius = 10;  // Assuming nodes may have a radius

        return (nodeX + radius >= minX && nodeX - radius <= maxX) &&
               (nodeY + radius >= minY && nodeY - radius <= maxY);
      });

      console.log('Nodes selected for deletion:', this.nodesToDelete);

      // Show confirmation dialog if nodes are selected
      if (this.nodesToDelete.length > 0) {
        this.isConfirmationVisible = true;
      }

      // Reset selection start and end
      this.selectionStart = null;
      this.selectionEnd = null;

      // Redraw the canvas without the selection box
      this.redrawCanvas();
    }
    if (this.draggingZonePoint && this.selectedZonePoint && this.selectedZone) {
      if (this.isZoneOverlapping(this.selectedZone.pos)) {
        this.draggingZonePoint = false;

        this.selectedZonePoint.x = this.originalZonePointPosition?.x
          ? this.originalZonePointPosition?.x
          : x;
        this.selectedZonePoint.y = this.originalZonePointPosition?.y
          ? this.originalZonePointPosition?.y
          : y;
        // alert('Zone point overlaps with another zone!');
        this.messageService.add({
          severity: 'error',
          summary: 'Warning',
          detail: 'Zone point overlaps with another zone!',life:4000
        });
        // this.selectedZonePoint = null;
        this.redrawCanvas();
        return;
      }

      this.draggingZonePoint = false;
      this.selectedZonePoint = null;
      this.selectedZone = null;
    }

    if (
      this.isDrawingLine &&
      this.lineStartX !== null &&
      this.lineStartY !== null
    ) {
      this.isDrawingLine = false;
      const transformedY = canvas.height - y; // Flip the Y-axis
      // Finalize the line drawing
      this.drawArrowLine(
        this.lineStartX!,
        this.lineStartY!,
        this.lineEndX!,
        this.lineEndY!
      );
      setTimeout(() => {
        // Clear the canvas section where the arrow was drawn
        this.redrawCanvas(); // Ensure this redraws all existing elements except for the arrow
      }, 1500);
      // Reset the start and end positions
      this.lineStartX = this.lineStartY = this.lineEndX = this.lineEndY = null;

      // Remove the mousemove and mouseup event listeners
      this.overlayCanvas.nativeElement.removeEventListener( 'mousemove', this.onMouseMove.bind(this) );
      this.overlayCanvas.nativeElement.removeEventListener( 'mouseup', this.onMouseUp.bind(this) );
    }

    if(this.plottingMode === 'multi' && this.secondNode) this.showIntermediateNodesDialog = true;

    if (this.draggingZonePoint) {
      this.draggingZonePoint = false;
      this.originalZonePointPosition = null; // Clear original position
    }

    if (this.draggingAsset && this.selectedAsset) {

      this.draggingAsset = false;
      if (this.selectedAssetType) {
        // let asset : asset;
        this.assets = this.assets.map((asset) => {
          if (this.selectedAsset?.id === asset.id) {
            asset.x = x;
            asset.y = y;
            asset.type = this.selectedAsset.type;
            return asset;
          }
          return asset;
        });

        this.plotAsset(x, y, this.selectedAssetType);
        this.selectedAssetType = null; // Reset after plotting
        this.updateAssetPosition(this.selectedAsset.id, x, y);
        this.selectedAsset = null;
        return;
      }
      // Update asset position
      this.updateAssetPosition(this.selectedAsset.id, x, y);
      if(this.isPositionOccupied(x,transformedY,'asset')){
        this.selectedAsset.x = this.originalAssetPosition!.x;
        this.selectedAsset.y = this.originalAssetPosition!.y;
        // alert('Overlapping detected! Asset has been reset to its original position.');
        this.messageService.add({
          severity: 'error',
          summary: 'Warning',
          detail: 'Overlapping detected! Asset has been reset to its original position.'
        });
        this.redrawCanvas();
      }
      if(this.isOverlappingwithOtherAssets(this.selectedAsset)){
        this.selectedAsset.x = this.originalAssetPosition!.x;
        this.selectedAsset.y = this.originalAssetPosition!.y;
        // alert('Overlapping detected! Asset has been reset to its original position.');
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Overlapping detected! Asset has been reset to its original position.'
        });
        this.redrawCanvas();
      }

      // this.selectedAsset = null; // yet to uncomment..
    }

    if (this.draggingRobo && this.selectedRobo) {
      // Update the position of the selected robot
      this.selectedRobo.pos.x = x;
      this.selectedRobo.pos.y = y;

      // Check if the robot is overlapping with another one
      if (this.isOverlappingWithOtherRobos(this.selectedRobo)) {
        // Reset the robot to its original position if overlapping
        this.draggingRobo = false;

        this.selectedRobo.pos.x = this.originalRoboPosition!.x;
        this.selectedRobo.pos.y = this.originalRoboPosition!.y;
        // alert('Overlapping detected! Robot has been reset to its original position.');
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Overlapping detected! Asset has been reset to its original position.'
        });
        this.redrawCanvas();
        return
      }

      this.draggingRobo = false;
      if(this.selectedRobo){
        this.robos = this.robos.map((robo) => {
          if (this.selectedRobo?.roboDet.id === robo.roboDet.id) {
            robo.pos.x = x;
            robo.pos.y = y;
            robo.roboDet.selected = true;
            return robo;
          }
          return robo;
        });
      }
      this.redrawCanvas();
    }
     // Reset originalRoboPosition after the drag ends
     this.originalRoboPosition = null;

    if (this.draggingNode && this.selectedNode) {
      if(this.isPositionOccupied(x, y,'node')){
        this.selectedNode.nodePosition.x = this.originalNodePosition!.x;
        this.selectedNode.nodePosition.y = this.originalNodePosition!.y;
        // alert('node lapping with other assets');
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Node lapping with other assets'
        });
      }

      if(this.isOverLappingWithOtherNodes(this.selectedNode)){
        this.selectedNode.nodePosition.x = this.originalNodePosition!.x;
        this.selectedNode.nodePosition.y = this.originalNodePosition!.y;
        // alert('Overlapping detected! node has been reset to its original position.');
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Overlapping detected! Asset has been reset to its original position.'
        });
      }
      this.redrawCanvas();
      this.nodes = this.nodes.map((node) => {
        if (node.nodeId === this.selectedNode?.nodeId) {
          node.nodePosition.x = this.selectedNode.nodePosition.x;
          node.nodePosition.y = this.selectedNode.nodePosition.y;
          return node;
        }
        return node;
      });
      this.storeNodestoLocal();
      this.draggingNode = false;
    }

    // yet to remove..
    this.selectionStart = null;
    this.selectionEnd = null;
  }
  @HostListener('document:keydown', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    console.log('ESC pressed, disabling delete mode');
    this.isDeleteModeEnabled = false; // Disable delete mode
    // this.isPlottingEnabled =false;
    if(this.isZonePlottingEnabled){
      this.plottedPoints = [];
      this.isZonePlottingEnabled = false;
      this.isPopupVisible = false;
      this.firstPlottedPoint = null;
      // Redraw the canvas to remove the temporary zone points
      this.redrawCanvas();
    }
    // this.isZonePlottingEnabled=false;
    // this.isPlottingAsset =false;
    this.isEdgeDrawingInProgress =false;
  }
  }
  private isAssetClicked(
    asset: { x: number; y: number; type: string },
    mouseX: number,
    mouseY: number
  ): boolean {
    const radius = 10; // Adjust radius to match asset size
    const dx = mouseX - asset.x;
    const dy = mouseY - asset.y;
    return dx * dx + dy * dy <= radius * radius;
  }
  private updateAssetPosition(id: number, x: number, y: number): void {
    // Implement logic to update asset position in your data structure
    // Example: Find and update asset in this.assets
    const asset = this.assets.find((asset) => asset.id === id);
    if (asset) {
      asset.x = x;
      asset.y = y;
      this.redrawCanvas(); // Redraw canvas to show the updated position
    }
  }
  // Method to delete the currently selected asset
  deleteSelectedAsset(): void {
    if (this.selectedAsset) {
      // Filter out the selected asset from the assets array
      this.assets = this.assets.filter(
        (asset) => asset.id !== this.selectedAsset!.id
      );

      // Set selected asset to null as it's now deleted
      this.selectedAsset = null;
      this.DockPopup = false;

      // Redraw the canvas to reflect the updated assets
      this.redrawCanvas();
    }
  }
  private redrawCanvas(): void {
    const canvas = this.overlayCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.cdRef.detectChanges;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.assets.forEach((asset) =>
        this.plotAsset(asset.x, asset.y, asset.type)
      );
      // Draw nodes
      this.nodes.forEach((node) => this.drawNode(node, 'blue', false));

      // Draw edges using the stored edge color and type
      this.edges.forEach((edge) => {
        const fromNode = this.nodes.find(
          (node) => node.nodeId === edge.startNodeId
        );
        const toNode = this.nodes.find((node) => node.nodeId === edge.endNodeId);

        if (fromNode && toNode) {
          // Pass the stored direction (either 'uni' or 'bi') to the drawEdge function
          this.drawEdge(
            fromNode.nodePosition,
            toNode.nodePosition,
            edge.direction === 'UN_DIRECTIONAL' ? 'uni' : 'bi', // Ensure correct direction is passed
            fromNode.nodeId,
            toNode.nodeId
          );
        }
      });

      this.zones.forEach((zone) => {
        // Re-plot the points of the zone
        zone.pos.forEach((point, index) => {
          // Plot the first point in violet and others in red
          const isFirstPoint = index === 0;
          this.plotZonePoint(point.x, point.y, isFirstPoint);
        });
        this.plottedPoints = zone.pos;
        this.zoneType = zone.type;
        this.drawLayer();
        this.plottedPoints = [];
      });

      for (const robo of this.robos) {
        const isSelected = this.selectedRobo && this.selectedRobo.roboDet.id === robo.roboDet.id;
        this.plotRobo(robo.pos.x, robo.pos.y, !isSelected);

      }
    }
  }
  drawConnections(): void {
    if (!this.selectedNode || !this.lastSelectedNode) {
      console.log('Not enough nodes or mode is not set');
      return; // Ensure both nodes and a mode are selected
    }

    const fromId = this.getNodeId(this.lastSelectedNode);
    const toId = this.getNodeId({
      x: this.selectedNode.nodePosition.x,
      y: this.selectedNode.nodePosition.y,
    });

    console.log('Drawing connection between nodes with IDs:', fromId, toId);

    const canvas = this.overlayCanvas.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.log('Canvas context is not available');
      return;
    }

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;

    // Draw line between the nodes
    ctx.beginPath();
    ctx.moveTo(this.lastSelectedNode.x, this.lastSelectedNode.y);
    ctx.lineTo(this.selectedNode.nodePosition.x, this.selectedNode.nodePosition.y);
    ctx.stroke();
  }
  private getNodeId(node: { x: number; y: number }): number {
    const foundNode = this.nodes.find(
      (n) => n.nodePosition.x === node.x && n.nodePosition.y === node.y
    );
    return foundNode ? parseInt(foundNode.nodeId) : -1; // Return -1 if the node is not found
  }
  toggleOptionsMenu(): void {
    this.isOptionsMenuVisible = !this.isOptionsMenuVisible;

  }
  toggleCalibrationLayer(): void {
    this.isCalibrationLayerVisible = !this.isCalibrationLayerVisible;
    this.isOptionsMenuVisible = false; // Hide options menu when calibration layer is visible
  }
  hideCalibrationLayer(): void {
    this.isOptionsMenuVisible = false;
  }
  isPointOnEdge(edge: Edge, x: number, y: number): boolean {
    const canvas = this.overlayCanvas.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return false;

    const startNode = this.nodes.find((node) => node.nodeId === edge.startNodeId);
    const endNode = this.nodes.find((node) => node.nodeId === edge.endNodeId);

    if (!startNode || !endNode) return false;

    const startPos = { x: startNode.nodePosition.x, y: canvas.height - startNode.nodePosition.y };
    const endPos = { x: endNode.nodePosition.x, y: canvas.height - endNode.nodePosition.y };

    // Calculate the length of the line
    const lineLength = Math.sqrt(
      Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - startPos.y, 2)
    );

    // Calculate the projection of the point onto the line
    const projection =
      ((x - startPos.x) * (endPos.x - startPos.x) +
        (y - startPos.y) * (endPos.y - startPos.y)) /
      Math.pow(lineLength, 2);

    // Constrain projection to be between 0 and 1 (within the line segment)
    if (projection < 0 || projection > 1) {
      return false; // Point is outside the segment
    }

    // Calculate the closest point on the line segment
    const closestPoint = {
      x: startPos.x + projection * (endPos.x - startPos.x),
      y: startPos.y + projection * (endPos.y - startPos.y),
    };

    // Calculate the distance from the point (x, y) to the closest point on the line
    const distance = Math.sqrt(
      Math.pow(x - closestPoint.x, 2) + Math.pow(y - closestPoint.y, 2)
    );

    // Define a threshold distance for "close enough" to the line segment
    const threshold = 10; // Adjust this threshold as needed

    return distance < threshold;
  }

  submitEdgeDetails(): void {
    // Handle form submission, e.g., save edge details
    this.showPopup = false;
  }

  updateEdge() {
    if (!this.currentEdge.edgeId || !this.currentEdge.sequenceId || !this.currentEdge.minHeight || !this.currentEdge.orientation || !this.currentEdge.orientationType || !this.currentEdge.maxRotationSpeed) {
        this.showEdgeError = true; // Show error message
        return; // Stop saving if validation fails
    }

    // If validation passes, hide the error message
    this.showEdgeError = false;

    if (this.currentEdge) {
        // Update or save the edge
        this.edges = this.edges.map((edge) => {
            if (this.currentEdge.edgeId === edge.edgeId) {
                // Preserve color and direction
                edge = { ...this.currentEdge }; // Update with new values
            }
            return edge;
        });
        
        // Save the current edge details
        this.savedEdge = { ...this.currentEdge };
        this.redrawCanvas();
    }
    console.log(this.edges);
    this.showPopup = false;
}
cancelEdge(): void {
  if(!this.savedEdge){ 
    // this.currentEdge.edgeId = '';
    // this.currentEdge.sequenceId= 0;
    this.currentEdge.edgeDescription= '';
    this.currentEdge.released= false;
    // this.currentEdge.startNodeId= '';
    // this.currentEdge.endNodeId= '';
    this.currentEdge.maxSpeed= 0;
    this.currentEdge.maxHeight= 0;
    this.currentEdge.minHeight= 0;
    this.currentEdge.orientation= 0;
    this.currentEdge.orientationType= '';
    // this.currentEdge.direction= 'UN_DIRECTIONAL';
    this.currentEdge.rotationAllowed= false;
    this.currentEdge.maxRotationSpeed= 0;
    this.currentEdge.length= 0;
    this.currentEdge.action= [];
  }
  // if (this.savedEdge) {
  //   // Revert the current edge to the last saved values
  //   this.currentEdge = { ...this.savedEdge };  // Restore saved edge details
  // }
  this.showPopup = false;
  this.showEdgeError = false;
  console.log(this.currentEdge);
  console.log(this.originalEdgeDetails );  
}
  // Method to delete the edge
  deleteEdge(): void {
    if (this.currentEdge) {
      // Remove the edge from the edges array
      this.edges = this.edges.filter(
        (edge) => edge.edgeId !== this.currentEdge?.edgeId
      );

      // Redraw the canvas
      this.redrawCanvas();

      // Hide the popup
      this.cancelEdge();
    }
  }
}
