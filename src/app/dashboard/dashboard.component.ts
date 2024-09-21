import {
  Component,
  AfterViewInit,
  ChangeDetectorRef,
  ViewChild,
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

  eventSource!: EventSource;
  ONBtn = false;
  showDashboard = false;
  selectedFloor = 'Floor 1';
  floors = ['Floor 1'];
  zoomLevel = 0.9;
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
  robos: any[] = [];
  ratio: number = 1;
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

  constructor(
    private projectService: ProjectService,
    private cdRef: ChangeDetectorRef
  ) {
    if (this.projectService.getIsMapSet()) return;
    this.onInitMapImg(); // yet to remove..
  }

  ngAfterViewInit(): void {
    this.robotImages = {
      robotB: new Image()
    }
    this.assetImages = {
      docking: new Image(),
      charging: new Image(),
    };
    this.assetImages['docking'].src = 'assets/Asseticon/docking-station.svg';
    this.assetImages['charging'].src = 'assets/Asseticon/charging-station.svg';

    this.robotImages['robotB'] = new Image();
    this.robotImages['robotB'].src = 'assets/CanvasRobo/robotB.svg';
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
    this.ratio = data.map.mpp;

    this.nodes = mapData.nodes.map((node: any) => {
      // yet to interface in this component..
      node.nodePosition.x = node.nodePosition.x / (this.ratio || 1);
      node.nodePosition.y = node.nodePosition.y / (this.ratio || 1);
      return node;
    });

    this.edges = mapData.edges;

    this.assets = mapData.stations.map((asset: any) => {
      // yet to interface in this component..
      asset.x = asset.x / (this.ratio || 1);
      asset.y = asset.y / (this.ratio || 1);
      return asset;
    });

    this.zones = mapData.zones.map((zone: any) => {
      // yet to interface in this component..
      zone.pos = zone.pos.map((pos: any) => {
        pos.x = pos.x / (this.ratio || 1);
        pos.y = pos.y / (this.ratio || 1);
        return pos;
      });
      return zone;
    });

    this.robos = mapData.roboPos.map((robo:any)=>{
      robo.pos.x = robo.pos.x / (this.ratio || 1);
      robo.pos.y = robo.pos.y / (this.ratio || 1);
      return robo;
    })
  }

  // guess no need..
  async ngOnInit() {
    if (!this.projectService.getMapData()) {
      await this.onInitMapImg();
      return;
    }
    this.loadCanvas();
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

  // start-stop the operation!
  startStopOpt() {
    if (this.UptimeComponent) this.UptimeComponent.getUptimeIfOn(); // call the uptime comp function
    if (this.throughputComponent) this.throughputComponent.getThroughPutIfOn();
  }

  toggleONBtn() {
    this.ONBtn = !this.ONBtn;
    if (this.ONBtn) this.getliveAmrPos();
    if (!this.ONBtn) this.eventSource.close(); // try take of it..
  }

  getOnBtnImage(): string {
    return this.ONBtn
      ? '../../assets/icons/off.svg'
      : '../../assets/icons/on.svg';
  }

  async toggleModelCanvas() {
    this.showModelCanvas = !this.showModelCanvas;
    if (!this.showModelCanvas) {
      this.nodes = [];
    } else await this.getMapDetails();
    this.loadCanvas(); // Redraw the canvas based on the updated state
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

  draw(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
    const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Calculate the position to center the image
    const imgWidth = img.width * this.zoomLevel;
    const imgHeight = img.height * this.zoomLevel;

    const centerX = (canvas.width - imgWidth) / 2 + this.offsetX;
    const centerY = (canvas.height - imgHeight) / 2 + this.offsetY;
    // Apply transformation for panning and zooming
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(this.zoomLevel, this.zoomLevel);

    // Draw the image
    ctx.drawImage(img, 0, 0);

    if (!this.showModelCanvas) return;
    // Draw nodes on the image
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

    this.robos.forEach((robo) =>
      this.plotRobo(ctx, robo.pos.x, robo.pos.y, robo.roboDet.selected) // this.selectedRobo === robo - replace..
    );
    // ctx.restore(); // Reset transformation after drawing
  }

  plotRobo(ctx: CanvasRenderingContext2D, x: number, y: number, isSelected: boolean = false): void {
    const image = this.robotImages['robotB'];
    // const canvas = this.overlayCanvas.nativeElement;
    // const ctx = canvas.getContext('2d');

    if (image && ctx) {
      const imageSize = 20;

      // Highlight the selected robot with a border or background
      // if (isSelected) { yet to replaced..
      //   ctx.beginPath();
      //   ctx.arc(x, y, imageSize * 1, 0, 2 * Math.PI); // Draw a circle centered on the robot
      //   ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // Semi-transparent red
      //   ctx.fill();
      //   ctx.closePath();
      // }

      // Draw the robot image
      ctx.drawImage(
        image,
        x - imageSize / 2,
        y - imageSize / 2,
        imageSize * 1.3,
        imageSize
      );
    }
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

  loadCanvas() {
    const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const img = new Image();
      let imgName = this.projectService.getMapData();
      img.src = `http://${imgName.imgUrl}`;

      img.onload = () => {
        canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
        canvas.height =
          canvas.parentElement?.clientHeight || window.innerHeight;
        this.draw(ctx, img);

        // // Conditionally draw nodes based on showModelCanvas flag
        // if (this.showModelCanvas) {
        //   this.nodes.forEach((node) => {
        //     this.drawNode(ctx, node.nodePosition.x, node.nodePosition.y, node.nodeId);
        //   });
        // }
      };
    }
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
