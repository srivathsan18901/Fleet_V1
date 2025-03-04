import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { ProjectService } from './project.service';

@Injectable({
  providedIn: 'root',
})
export class NodeGraphService {
  private nodes: any[] = [];
  private edges: any[] = [];
  private assets: any[] = [];
  private zones: any[] = [];
  private simMode: any[] = [];
  private robos: any[] = [];
  private zoomLevel: number = 1.0;
  private offsetX: number = 0;
  private offsetY: number = 0;

  public mapName: string = '';
  public siteName: string = '';
  public roboPos: any[] = [];

  private isShowPath: boolean = false;
  private isShowRoboPath: number = 0;
  private roboToLocalize: number | null = null;
  private draggingRobo: any = null;
  roboIDColor: Map<number, string> = new Map<number, string>(); // check...
  fleetRoboIDColor: Map<number, string> = new Map<number, string>();
  showModelCanvas: boolean = false;
  assignTask: boolean = false;
  isImage: boolean = false;

  localize: boolean = false;
  constructor(private projectService: ProjectService) {}

  setImage(isImage: boolean) {
    this.isImage = isImage;
  }

  getImage(): boolean {
    return this.isImage;
  }
  // Save data methods
  setNodes(nodes: any[]) {
    this.nodes = nodes;
  }

  getNodes() {
    return this.nodes;
  }

  setEdges(edges: any[]) {
    this.edges = edges;
  }

  getEdges() {
    return this.edges;
  }

  setAssets(assets: any[]) {
    this.assets = assets;
  }

  getAssets() {
    return this.assets;
  }

  setZones(zones: any[]) {
    this.zones = zones;
  }

  getZones() {
    return this.zones;
  }

  setShowModelCanvas(state: boolean) {
    this.showModelCanvas = state;
  }

  getShowModelCanvas(): boolean {
    return this.showModelCanvas;
  }

  setAssignTask(state: boolean) {
    this.assignTask = state;
  }

  getAssignTask(): boolean {
    return this.assignTask;
  }

  setLocalize(state: boolean) {
    this.localize = state;
  }

  getLocalize(): boolean {
    return this.localize;
  }

  setRoboToLocalize(robotId: number) {
    this.roboToLocalize = robotId;
  }

  getRoboToLocalize(): number | null {
    return this.roboToLocalize;
  }

  setsimMode(simMode: any[]) {
    this.simMode = simMode;
  }

  getsimMode() {
    // console.log(this.simMode);
    return this.simMode;
  }

  setRoboIdClr(
    roboIDColor: Map<number, string>,
    fleetRoboIDColor: Map<number, string>
  ) {
    this.roboIDColor = roboIDColor;
    this.fleetRoboIDColor = fleetRoboIDColor;
  }

  getRoboIdClr(): Map<number, string> {
    return this.roboIDColor;
  }

  setRobos(robos: any[]) {
    this.robos = robos;
  }

  getRobos() {
    return this.robos;
  }

  setZoomLevel(zoomLevel: number) {
    this.zoomLevel = zoomLevel;
  }

  getZoomLevel() {
    return this.zoomLevel;
  }

  setOffsetX(offsetX: number) {
    this.offsetX = offsetX;
  }

  getOffsetX() {
    return this.offsetX;
  }

  setOffsetY(offsetY: number) {
    this.offsetY = offsetY;
  }

  getOffsetY() {
    return this.offsetY;
  }

  setIsShowPath(isShowPath: boolean) {
    this.isShowPath = isShowPath;
  }
  getIsShowPath() {
    return this.isShowPath;
  }
  setIsShowRoboPath(isShowRoboPath: number) {
    this.isShowRoboPath = isShowRoboPath;
  }
  getIsShowRoboPath(): number {
    return this.isShowRoboPath;
  }

  setDraggingRobo(draggingRobo: any) {
    this.draggingRobo = draggingRobo;
  }

  getDraggingRobo() {
    return this.draggingRobo;
  }

  async updateEditedMap(): Promise<boolean> {
    try {
      let mapData = this.projectService.getMapData();
      // return false;

      let editedMap = {
        mapName: this.mapName,
        siteName: this.siteName,
        mpp: null,
        origin: null,
        nodes: this.nodes,
        edges: this.edges,
        zones: null,
        stations: null,
        roboPos: this.roboPos,
      };

      let response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/update-map/${mapData.mapName}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editedMap),
        }
      );
      let data = await response.json();
      if ('mapExists' in data) return true;

      return false;
    } catch (error) {
      return false;
    }
  }
}
