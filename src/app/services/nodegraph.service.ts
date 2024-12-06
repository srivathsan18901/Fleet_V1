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
  private robotState: { [key: string]: boolean } = {};

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
    console.log(this.simMode);
    return this.simMode;
  }

  setRobos(robos: any[]) {
    this.robos = robos;
  }

  getRobos() {
    return this.robos;
  }
  // Save robot state
  setRobotState(robotId: string, isActive: boolean) {
    this.robotState[robotId] = isActive;
    sessionStorage.setItem('robotState', JSON.stringify(this.robotState)); // Persist to sessionStorage
  }

  // Get robot state
  getRobotState(robotId: string): boolean {
    const savedState = JSON.parse(sessionStorage.getItem('robotState') || '{}');
    return savedState[robotId] !== undefined ? savedState[robotId] : false;
  }

}
