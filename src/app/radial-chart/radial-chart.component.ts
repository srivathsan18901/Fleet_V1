import { Component, OnInit,Input,ViewChild,EventEmitter} from '@angular/core';
import {
  ApexNonAxisChartSeries,
  ApexChart,
  ApexPlotOptions,
  ApexFill, // Import ApexFill for colors
  ApexStroke, // Import ApexStroke for stroke customization
  ChartComponent
} from 'ng-apexcharts';
import { ProjectService } from '../services/project.service';
import { environment } from '../../environments/environment.development';
import { IsFleetService } from '../services/shared/is-fleet.service';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  labels: string[];
  fill: ApexFill; // Add fill property for colors
  stroke: ApexStroke; // Optional: Add stroke for better clarity
};

@Component({
  selector: 'app-radial-chart',
  templateUrl: './radial-chart.component.html',
  styleUrls: ['./radial-chart.component.css'],
})
export class RadialChartComponent implements OnInit {
  @ViewChild("chart") chart!: ChartComponent;
  @Input() isFleet!:boolean;
  
  mapData:any|null=null;
  robos: any[] = [];
  simMode:any[]=[];

  public chartOptions!: Partial<ChartOptions>;
  roboStatePie: number[] = [0, 0, 0];
  selectedMap: any | null = null;
  currentFilter: string = 'today'; // To track the selected filter
  totCount: string = '0';

  constructor(
    private projectService: ProjectService,
    private isFleetService: IsFleetService
  ) {
    this.chartOptions = {
      series: this.roboStatePie,
      chart: {
        height: 345,
        type: 'radialBar',
      },
      plotOptions: {
        radialBar: {
          dataLabels: {
            name: {
              fontSize: '30px',
            },
            value: {
              fontSize: '26px',
              fontWeight: 600,
            },
            total: {
              show: true,
              label: 'Total',
              formatter: () => this.totCount, // Dynamic total count
            },
          },
          track: {
            background: '#e0e0e0', // Track background color (grayish)
          },
        },
      },
      fill: {
        colors: ['#59ED9D', '#FECC6A', '#FF6E6E'], // Green, Yellow, Red
      },
      stroke: {
        lineCap: 'round', // Rounded end of bars for better visual
      },
      labels: ['Healthy', 'Inactive', 'Error'], // Label names
    };
  }

  async ngOnInit() {
    this.isFleetService.isFleet$.subscribe((value) => {
      this.isFleet = value; // React to changes
      console.log('isFleet in RadialChartComponent:', this.isFleet);
    });

    await this.getMapDetails();
 
    if (this.selectedMap) return;
    this.selectedMap = this.projectService.getMapData();

    this.roboStatePie = await this.getRobosStates();
    this.chartOptions.series = [...this.roboStatePie]; // Update series with data

    setInterval(async () => {
      this.roboStatePie = await this.getRobosStates();
      this.chartOptions.series = [...this.roboStatePie];
    }, 1000 * 2); // Update every 5 seconds
  }
  
  updateChart() {
    this.chartOptions.series = [...this.roboStatePie];
  }

  public activeRobots: number = 0; // Example active robots count
  public totalRobots: number = 0;
  public errorRobots: number = 0;

  async getMapDetails() {
    this.mapData = this.projectService.getMapData();
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${this.mapData.mapName}`
    );
    if (!response.ok)
      throw new Error(`Error with status code of ${response.status}`);
    let data = await response.json();

    if (!data.map) return;
    let mapDet = data.map;

    this.robos = mapDet.roboPos;
    this.simMode = mapDet.simMode;  // Assuming this is also required for other parts of your logic

    this.totalRobots = this.isFleet ? this.robos.length : this.simMode.length;
    this.totCount = this.totalRobots.toString();
  }
  
  
  applyFilter(filter: string) {
    this.currentFilter = filter;
    this.updateChartWithFilter();
  }

  async updateChartWithFilter() {
    this.roboStatePie = await this.getRobosStates();
    this.chartOptions.series = [...this.roboStatePie];
  }

  async getRobosStates(): Promise<number[]> {
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/stream-data/get-live-robos/${this.mapData.id}`, 
      {
        method: 'GET',
        credentials: 'include'
      }
    );
  
    let data = await response.json(); 
    if (!data.map || data.error) return [0, 0, 0];

    let { robots } = data.robos;
    // console.log(robots)
    if (!robots) return [0, this.totalRobots, 0];
    
    let active_robos = 0;
    let err_robos = 0;
  
    robots.forEach((robo: any) => {
      active_robos += robo.isConnected ? 1 : 0;
      if ('EMERGENCY STOP' in robo.robot_errors || 'LIDAR_ERROR' in robo.robot_errors) err_robos += 1;
    });
  
    // console.log("tot robos : ", [active_robos - err_robos, active_robos - this.totalRobots, err_robos]);
    return [active_robos - err_robos, active_robos - this.totalRobots, err_robos];
  }
  
}
