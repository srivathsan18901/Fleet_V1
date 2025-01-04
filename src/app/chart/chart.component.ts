import { Component, ViewChild, Input, ChangeDetectorRef } from '@angular/core';
import { ProjectService } from '../services/project.service';
import {
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ApexFill,
  ApexStroke,
} from 'ng-apexcharts';
import { environment } from '../../environments/environment.development';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  stroke: ApexStroke;
};

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css'],
})
export class ChartComponent {
  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  @Input() ONBtn!: boolean;

  selectedProj: any | null = null;
  mapData: any | null = null;
  activeRobots: number = 0;
  totalRobots: number = 0;

  liveRobos: any[] = [];
  liveRoboInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private projectService: ProjectService,
    private cdRef: ChangeDetectorRef
  ) {
    this.chartOptions = {
      series: [(this.activeRobots / this.totalRobots) * 100], // normalized value..
      chart: {
        width: 230,
        height: 250,
        type: 'radialBar',
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        radialBar: {
          offsetY: -25,
          startAngle: -180,
          endAngle: 180,
          hollow: {
            margin: 1,
            size: '60%',
            background: '#fff',
            image: undefined,
            position: 'front',
          },
          track: {
            background: '#ffe5e5',
            strokeWidth: '70%',
            margin: -5,
          },
          dataLabels: {
            show: true,
            name: {
              offsetY: 85,
              show: true,
              color: '#FF3333',
              fontSize: '10px',
            },
            value: {
              formatter: this.currentActiveRobots.bind(this),
              offsetY: -5,
              color: '#FF3333',
              fontSize: '25px',
              show: true,
            },
          },
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'vertical',
          shadeIntensity: 0.1,
          gradientToColors: ['#FFFFFF'],
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100],
          colorStops: [
            {
              offset: 0,
              color: '#FFB3B3',
              opacity: 1,
            },
            {
              offset: 80,
              color: '#FF3333',
              opacity: 1,
            },
          ],
        },
      },
      stroke: {
        lineCap: 'round',
      },
      labels: ['Number of Active Robots'],
    };
  }

  async ngOnInit() {
    this.selectedProj = this.projectService.getSelectedProject();
    this.mapData = this.projectService.getMapData();
    await this.fetchTotRobos();
    this.liveRobos = await this.getLiveRoboInfo();
    this.updateLiveRoboInfo();
    this.liveRoboInterval = setInterval(async () => {
      this.liveRobos = await this.getLiveRoboInfo();
      this.updateLiveRoboInfo();
    }, 1000 * 3); // yet to max the interval time..
  }

  async fetchTotRobos() {
    if (!this.selectedProj || !this.mapData) return;
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/robo-configuration/get-robos/${this.mapData.id}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );
    let data = await response.json();
    const { populatedRobos } = data;
    // console.log(data);

    this.totalRobots = populatedRobos.length;
    this.cdRef.detectChanges();
  }

  async getLiveRoboInfo(): Promise<any[]> {
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/stream-data/get-live-robos/${this.mapData.id}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const data = await response.json();
    // console.log(data);
    if (!data.map || data.error) return [];
    return data.robos;
  }

  updateLiveRoboInfo() {
    // console.log(this.liveRobos);

    if (!('robots' in this.liveRobos)) {
      this.activeRobots = 0;
      return;
    }
    let { robots }: any = this.liveRobos;
    this.activeRobots = robots.length;
    this.chartOptions.series = [(this.activeRobots / this.totalRobots) * 100]; // yet to look at it..
  }

  currentActiveRobots(): string {
    return `${this.activeRobots}/${this.totalRobots}`;
  }

  ngOnDestroy() {
    if (this.liveRoboInterval) clearInterval(this.liveRoboInterval);
  }
}
