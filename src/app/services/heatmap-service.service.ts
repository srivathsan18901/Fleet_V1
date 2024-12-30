import { Injectable } from '@angular/core';
import HeatMap from 'heatmap-ts';
import { environment } from '../../environments/environment.development';
import { ProjectService } from './project.service';

interface Coor {
  x: number;
  y: number;
  // intensity: number;
}
@Injectable({
  providedIn: 'root',
})
export class HeatmapService {
  private heatmapInstances: Map<string, any> = new Map();

  origin: any | null = null;
  ratio: number | null = null;
  heatMap: any[] | null = null;
  accumulatedData: Coor[] = [];
  accumulatedSet: { x: number; y: number; intensity: number }[] = [];

  offHeatmapId: string | null = null;

  constructor(private projectService: ProjectService) {}

  createHeatmap(id: string, container: HTMLElement, config: any): void {
    const heatmapInstance = new HeatMap({ ...config, container });
    this.heatmapInstances.set(id, heatmapInstance);
  }

  getHeatmapInstance(id: string): HeatMap | undefined {
    return this.heatmapInstances.get(id);
  }

  addHeatmapData(id: string, data: any): void {
    const heatmapInstance = this.heatmapInstances.get(id);
    if (heatmapInstance) {
      heatmapInstance.setData(data);
    }
  }

  updateHeatmapData(id: string, points: any[]): void {
    const heatmapInstance = this.heatmapInstances.get(id);
    if (heatmapInstance) {
      heatmapInstance.addData(points);
    }
  }

  resizeHeatmap(id: string, width: number, height: number): void {
    const heatmapInstance = this.heatmapInstances.get(id);
    if (heatmapInstance) {
      const container = heatmapInstance.config.container;
      const canvas = container.querySelector('canvas');
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
        heatmapInstance.repaint();
      }
    }
  }

  setHeatmap(heatMap: any[]) {
    // this.heatMap = heatMap;
    this.accumulatedSet = heatMap;
  }

  getHeatmap() {
    return this.accumulatedSet;
  }

  setHeatmapId(heatmapId: string) {
    this.offHeatmapId = heatmapId;
  }

  getHeatmapId() {
    return this.offHeatmapId;
  }

  setOriginAndRatio(origin: any, ratio: number) {
    this.origin = origin;
    this.ratio = ratio;
  }

  getOrigin() {
    return this.origin;
  }

  getRatio() {
    return this.ratio;
  }

  async updateAccHmap() {
    let map = this.projectService.getMapData();
    if (!map) return;

    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/update-map/${map.mapName}`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heatMap: this.accumulatedSet }),
      }
    );

    let data = await response.json();
    // console.log(data);
  }

  accumulateCoors(coors: Coor) {
    // console.log(coors);

    this.accumulatedData.push(coors);

    if (this.accumulatedData.length >= 5) {
      this.accumulatedData.forEach((point) => {
        let existingCoor = this.accumulatedSet.find(
          (coor) => coor.x === point.x && coor.y === point.y
        );
        if (existingCoor) existingCoor.intensity += 1;
        else this.accumulatedSet.push({ x: point.x, y: point.y, intensity: 1 });
      });
      this.accumulatedData.length = 0; // instead of arr = [] cz, by dereferencing making it eligble for garbage collection, meanwhile .length = 0 makes the array truncating ( mem bit eff )
      this.updateAccHmap();
    }
  }
}
