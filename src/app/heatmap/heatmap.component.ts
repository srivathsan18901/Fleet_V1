import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  Input,
  OnChanges,
} from '@angular/core';
import { HeatmapService } from '../services/heatmap-service.service';
import { NodeGraphService } from '../services/nodegraph.service';
import HeatMap from 'heatmap-ts';

@Component({
  selector: 'app-heatmap',
  templateUrl: './heatmap.component.html',
  styleUrl: './heatmap.component.css',
})
export class HeatmapComponent implements OnChanges {
  @ViewChild('heatmapContainer', { static: true }) containerRef!: ElementRef;
  @Input() mapImageHeight!: number;
  @Input() mapImageWidth!: number;

  zoomLevel = 1.0;
  offsetX = 0;
  offsetY = 0;

  origin: any | null = null;
  ratio: number | null = null;
  heatmapInstance: any | null = null;
  private heatmapId = 'heatMap';
  heatmap: any[] | null = null;

  constructor(
    private heatmapService: HeatmapService,
    private nodeGraphService: NodeGraphService
  ) {}

  ngOnChanges(changes: any) {
    if (changes.mapImageHeight.firstChange || changes.mapImageWidth.firstChange)
      return;
    this.ngOnInit();
  }

  ngOnInit() {
    this.origin = this.heatmapService.getOrigin();
    this.ratio = this.heatmapService.getRatio();
    this.zoomLevel = this.nodeGraphService.getZoomLevel();
    this.offsetX = this.nodeGraphService.getOffsetX();
    this.offsetY = this.nodeGraphService.getOffsetY();

    const container = this.containerRef.nativeElement;
    const existingCanvas = container.querySelector('canvas');
    if (existingCanvas) container.removeChild(existingCanvas);

    this.heatmapService.setHeatmapId(this.heatmapId);
    this.heatmapService.createHeatmap(this.heatmapId, container, {
      maxOpacity: 0.9,
      radius: 20 * this.nodeGraphService.getZoomLevel(), // 30
      blur: 0.9,
      width: this.mapImageWidth,
      height: this.mapImageHeight,
    });

    this.heatmap = this.heatmapService.getHeatmap();

    this.heatmapService.addHeatmapData(
      this.heatmapId,
      this.getHeatmapData(this.heatmap)
    );
    // console.log(this.getHeatmapData(this.heatmap));
  }

  ngAfterViewInit(): void {
    // const container = this.containerRef.nativeElement;
    // this.heatmapService.createHeatmap(this.heatmapId, container, {
    //   maxOpacity: 0.6,
    //   radius: 20,
    //   blur: 0.9,
    //   width: this.width,
    //   height: this.height,
    //   // width: container.offsetWidth,
    //   // height: container.offsetHeight,
    // });
    // this.heatmapService.addHeatmapData(
    //   this.heatmapId,
    //   this.generateRandomData(500)
    // );
  }

  private getHeatmapData(heatmap: any[]): any {
    let max = 1;
    let min = 0;
    const data = [];
    let len = heatmap.length;
    while (len--) {
      // if (this.mapImageHeight && heatmap[len].x !== 0 && heatmap[len].x !== 0) {
        let posX =
          (((heatmap[len].x + (this.origin.x || 0)) * this.zoomLevel) /
            (this.ratio || 1)) >>
          0;
        let posY =
          (((heatmap[len].y + (this.origin.y || 0)) * this.zoomLevel) /
            (this.ratio || 1)) >>
          0;
        let transY = this.mapImageHeight - posY; // Adjust for Y-axis inversion

        let val = heatmap[len].intensity >> 0;
        if (min >= val) min = val;
        if (max <= val) max = val;

        data.push({
          x: posX,
          y: transY,
          value: val,
          // radius: (10) >> 0,
        });
      // }
    }
    return { max, min, data };
  }

  private resizeHeatmap(): void {
    if (this.mapImageHeight && this.mapImageWidth) {
      this.heatmapService.resizeHeatmap(
        this.heatmapId,
        this.mapImageWidth,
        this.mapImageHeight
      );
    }
  }

  private generateRandomData(len: number): any {
    const max = 10;
    const min = 1;
    const maxX = this.containerRef.nativeElement.offsetWidth; // Width of the container
    const maxY = this.containerRef.nativeElement.offsetHeight; // Height of the container
    const data = [];
    while (len--) {
      data.push({
        x: (Math.random() * maxX) >> 0,
        y: (Math.random() * maxY) >> 0,
        value: (Math.random() * max + min) >> 0,
        radius: (Math.random() * 50 + min) >> 0,
      });
    }
    return { max, min, data };
  }
}
