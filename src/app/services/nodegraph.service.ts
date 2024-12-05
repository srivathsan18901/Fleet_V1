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
    return this.simMode;
  }
  
  setRobos(robos: any[]) {
    this.robos = robos;
  }

  getRobos() {
    return this.robos;
  }
  
}
