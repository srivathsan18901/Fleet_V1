import {
  ChangeDetectorRef,
  Component,
  OnInit,
  Input,
  ViewChild,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import {
  ApexNonAxisChartSeries,
  ApexChart,
  ApexPlotOptions,
  ApexFill, // Import ApexFill for colors
  ApexStroke, // Import ApexStroke for stroke customization
  ChartComponent,
} from 'ng-apexcharts';
import { ProjectService } from '../services/project.service';
import { environment } from '../../environments/environment.development';
import { IsFleetService } from '../services/shared/is-fleet.service';
import { TranslationService } from '../services/translation.service';
import { Subscription } from 'rxjs';

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
  @ViewChild('chart') chart!: ChartComponent;
  @Input() isFleet!: boolean;

  mapData: any | null = null;
  robos: any[] = [];
  simMode: any[] = [];

  public chartOptions!: Partial<ChartOptions>;
  roboStatePie: number[] = [0, 0, 0];
  selectedMap: any | null = null;
  currentFilter: string = 'today'; // To track the selected filter
  totCount: string = '0';

  roboStatusInterval: ReturnType<typeof setInterval> | null = null;
  robosCountController: AbortController | null = null;

  constructor(
    private projectService: ProjectService,
    private isFleetService: IsFleetService,
    private cdRef: ChangeDetectorRef,
    private translationService: TranslationService
  ) {
    this.chartOptions = {
      series: this.roboStatePie,
      chart: {
        height: 300,
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
              label: this.getTranslation('total'),
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
      labels: ['Active', 'Inactive', 'Error'], // Label names
    };
  }
  getTranslation(key: string) {
    return this.translationService.getStatisticsTranslation(key);
  }
  private langSubscription!: Subscription;
  async ngOnInit() {
    this.langSubscription = this.translationService.currentLanguage$.subscribe(
      (val) => {
        this.chartOptions = {
          series: this.roboStatePie,
          chart: {
            height: 300,
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
                  label: this.getTranslation('total'),
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
          labels: ['Active', 'Inactive', 'Error'], // Label names
        };
        this.cdRef.detectChanges();
      }
    );
    // this.isFleetService.isFleet$.subscribe((value) => { // use for later..
    //   this.isFleet = value; // React to changes
    //   console.log('isFleet in RadialChartComponent:', this.isFleet);
    // });
    this.isFleet = sessionStorage.getItem('isFleet') == 'true' ? true : false;

    await this.getMapDetails();

    if (this.selectedMap) return;
    this.selectedMap = this.projectService.getMapData();

    this.roboStatePie = await this.getRobosStates();
    this.chartOptions.series = [...this.roboStatePie]; // Update series with data

    this.roboStatusInterval = setInterval(async () => {
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
    this.simMode = mapDet.simMode; // Assuming this is also required for other parts of your logic

    this.totalRobots = this.isFleet ? this.robos.length : this.simMode.length;
    this.totCount = this.totalRobots.toString();
  }

  // applyFilter(filter: string) {
  //   this.currentFilter = filter;
  //   this.updateChartWithFilter();
  // }

  // async updateChartWithFilter() {
  //   this.roboStatePie = await this.getRobosStates();
  //   this.chartOptions.series = [...this.roboStatePie];
  // }

  async getRobosStates(): Promise<number[]> {
    if (this.robosCountController) this.robosCountController.abort();
    this.robosCountController = new AbortController();
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/stream-data/get-live-robos/${this.mapData.id}`,
      {
        method: 'GET',
        credentials: 'include',
        signal: this.robosCountController.signal,
      }
    );

    let data = await response.json();
    if (!data.map || data.error) return [0, 0, 0];

    let robots = data.robos;

    let active_robos = 0;
    let err_robos = 0;

    if (robots?.robots)
      robots.robots.forEach((robo: any) => {
        active_robos += robo.isConnected ? 1 : 0;

        if (robo.robot_errors && Object.keys(robo.robot_errors).length)
          err_robos += 1;
      });

    return [active_robos, this.totalRobots - active_robos, err_robos];
  }

  ngOnDestroy() {
    if (this.roboStatusInterval) clearInterval(this.roboStatusInterval);
  }
}
