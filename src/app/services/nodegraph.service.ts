import { Injectable } from '@angular/core';

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
  private zoomLevel:number=1.0;
  private offsetX:number=0;
  private offsetY:number=0;
  private isShowPath: boolean = false;
  private isShowRoboPath: number = 0;
  roboIDColor: Map<number, string> = new Map<number, string>(); // check...

  showModelCanvas: boolean = false;

  constructor() {}

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

  getShowModelCanvas():boolean{
    return this.showModelCanvas;
  }

  setsimMode(simMode: any[]) {
    this.simMode = simMode;
  }

  getsimMode() {
    // console.log(this.simMode);
    return this.simMode;
  }

  setRoboIdClr(roboIDColor: Map<number, string>){
    this.roboIDColor = roboIDColor;
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
  
  setZoomLevel(zoomLevel:number){
    this.zoomLevel = zoomLevel;
  }

  getZoomLevel(){
    return this.zoomLevel;
  }

  setOffsetX(offsetX:number){
    this.offsetX = offsetX;
  }

  getOffsetX(){
    return this.offsetX;
  }

  setOffsetY(offsetY:number){
    this.offsetY = offsetY;
  }

  getOffsetY(){
    return this.offsetY;
  }

  setIsShowPath(isShowPath: boolean){
    this.isShowPath = isShowPath;
  }
  getIsShowPath(){
    return this.isShowPath;
  }
  setIsShowRoboPath(isShowRoboPath: number){
    this.isShowRoboPath = isShowRoboPath;
  }
  getIsShowRoboPath(): number{
    return this.isShowRoboPath;
  }
  
}
