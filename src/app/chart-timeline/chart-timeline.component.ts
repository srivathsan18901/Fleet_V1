import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexMarkers,
  ApexTooltip,
  ApexFill,
  ApexStroke,
} from 'ng-apexcharts';
import { ProjectService } from '../services/project.service';
import { environment } from '../../environments/environment.development';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
  tooltip: ApexTooltip;
  fill: ApexFill;
  stroke: ApexStroke;
  grid?: any;
};

@Component({
  selector: 'app-chart-timeline',
  templateUrl: './chart-timeline.component.html',
  styleUrls: ['./chart-timeline.component.css'],
})
export class ChartTimelineComponent implements OnInit {
applyFilter(arg0: string) {
throw new Error('Method not implemented.');
}
  // @ViewChild('chart') chart: ChartComponent | undefined;
  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: ChartOptions;

  selectedMetric: string = 'CPU Utilization';
  selectedMap: any | null = null;

  // Updated data sets..
  cpuUtilArr: number[] = [0];
  cpuXaxisSeries: string[] = [];

  roboUtilArr: number[] = [0];
  roboXaxisSeries: string[] = [];

  batteryArr: number[] = [0];
  batteryXaxisSeries: string[] = [];

  memoryArr: number[] = [0];
  memoryXaxisSeries: string[] = [];

  networkArr: number[] = [0];
  networkXaxisSeries: string[] = [];

  idleTimeArr: number[] = [0];
  idleTimeXaxisSeries: string[] = [];

  errorArr: number[] = [0];
  errRateXaxisSeries: string[] = [];

  cpuUtilTimeInterval: any | null = null;
  roboUtilTimeInterval: any | null = null;
  batteryTimeInterval: any | null = null;
  memoryTimeInterval: any | null = null;
  networkTimeInterval: any | null = null;
  idleTimeInterval: any | null = null;
  errTimeInterval: any | null = null;

  constructor(
    private projectService: ProjectService,
    private cdRef: ChangeDetectorRef
  ) {
    // this.chartOptions = this.getChartOptions(this.cpuUtilArr, 'CPU Utilization');
    this.chartOptions = {
      series: [
        {
          name: '',
          data: this.cpuUtilArr,
        },
      ],
      chart: {
        id: 'area-datetime',
        type: 'area',
        height: 250,
        zoom: {
          autoScaleYaxis: true,
        },
      },
      // colors: ['#77B6EA', '#545454'],
      dataLabels: {
        enabled: true,
      },
      markers: {
        size: 0,
      },
      xaxis: {
        categories: [], // Your default categories
        labels: {
          style: {
            colors: '#9aa0ac',
            fontSize: '12px',
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: '#9aa0ac',
            fontSize: '12px',
          },
        },
      },
      tooltip: {
        x: {
          format: 'dd MMM yyyy',
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.9,
          colorStops: [
            {
              offset: 0,
              color: '#7854f7',
              opacity: 0.7,
            },
            {
              offset: 100,
              color: '#7854f7',
              opacity: 0.2,
            },
          ],
        },
      },
      stroke: {
        curve: 'smooth',
        width: 3,
        colors: ['#7854f7'],
      },
      grid: {
        borderColor: '#e7e7e7',
        row: {
          colors: ['#f3f3f3', 'transparent'],
          opacity: 0.5,
        },
      },
    };
  }

  ngOnInit() {
    this.selectedMap = this.projectService.getMapData();
    this.updateChart('data1', 'CPU Utilization');
  }

  updateChart(dataKey: string, metricName: string): void {
    this.selectedMetric = metricName; // Update the displayed metric name

    switch (dataKey) {
      case 'data1':
        this.updateCpuUtil();
        break;
      case 'data2':
        this.updateRoboUtil();
        break;
      case 'data3':
        this.updateBattery();
        break;
      case 'data4':
        this.updateMemory();
        break;
      case 'data5':
        this.updateNetwork();
        break;
      case 'data6':
        this.updateIdleTime();
        break;
      case 'data7':
        this.updateErr();
        break;
    }
  }

  async fetchSeriesData(apiKey: string): Promise<any> {
    try {
      const response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/graph/${apiKey}/${this.selectedMap.id}`,
        {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({
            timeStamp1: '',
            timeStamp2: '',
          }),
        }
      );
      const data = await response.json();
      if (data.error || !data.map) {
        console.log(data);
        return;
      }
      return data;
    } catch (err) {
      console.log('Err occured :', err);
      return;
    }
  }

  async updateCpuUtil() {
    let temp = [];
    let tempTime = [];
    let data;
    if (!this.selectedMap || this.cpuUtilTimeInterval) return;
    this.clearAllIntervals(this.cpuUtilTimeInterval);
    this.cpuUtilTimeInterval = setInterval(async () => {
      data = await this.fetchSeriesData('cpu-utilization'); // data.cpuUtil..
      this.cpuUtilArr.push(data.cpuUtil);
      tempTime.push(new Date().toLocaleTimeString()); // yet to take..
      if (this.cpuUtilArr.length > 12) temp = this.cpuUtilArr.slice(-12);
      else temp = [...this.cpuUtilArr];

      this.chartOptions.series = [{ data: temp }];
      this.chart.updateOptions(
        {
          xaxis: {
            categories: tempTime.length > 12 ? tempTime.slice(-12) : tempTime,
          },
        },
        false,
        true
      );
    }, 1000 * 2);
  }

  async updateRoboUtil() {
    let temp = [];
    let tempTime = [];
    let data;
    if (!this.selectedMap || this.roboUtilTimeInterval) return;
    this.clearAllIntervals(this.roboUtilTimeInterval);
    this.roboUtilTimeInterval = setInterval(async () => {
      data = await this.fetchSeriesData('robo-utilization'); // data.cpuUtil..
      this.roboUtilArr.push(data.roboUtil);
      tempTime.push(new Date().toLocaleTimeString()); // yet to take..
      if (this.roboUtilArr.length > 12) temp = this.roboUtilArr.slice(-12);
      else temp = [...this.roboUtilArr];

      this.chartOptions.series = [{ data: temp }];
      this.chart.updateOptions(
        {
          xaxis: {
            categories: tempTime.length > 12 ? tempTime.slice(-12) : tempTime,
          },
        },
        false,
        true
      );
    }, 1000 * 2);
  }

  async updateBattery() {
    let temp = [];
    let tempTime = [];
    let data;
    if (!this.selectedMap || this.batteryTimeInterval) return;
    this.clearAllIntervals(this.batteryTimeInterval);
    this.batteryTimeInterval = setInterval(async () => {
      data = await this.fetchSeriesData('battery'); // data.cpuUtil..
      this.batteryArr.push(data.batteryStat);
      tempTime.push(new Date().toLocaleTimeString()); // yet to take..
      if (this.batteryArr.length > 12) temp = this.batteryArr.slice(-12);
      else temp = [...this.batteryArr];

      this.chartOptions.series = [{ data: temp }];
      this.chart.updateOptions(
        {
          xaxis: {
            categories: tempTime.length > 12 ? tempTime.slice(-12) : tempTime,
          },
        },
        false,
        true
      );
    }, 1000 * 2);
  }

  async updateMemory() {
    let temp = [];
    let tempTime = [];
    let data;
    if (!this.selectedMap || this.memoryTimeInterval) return;
    this.clearAllIntervals(this.memoryTimeInterval);
    this.memoryTimeInterval = setInterval(async () => {
      data = await this.fetchSeriesData('memory'); // data.cpuUtil..
      this.memoryArr.push(data.memoryStat);
      tempTime.push(new Date().toLocaleTimeString()); // yet to take..
      if (this.memoryArr.length > 12) temp = this.memoryArr.slice(-12);
      else temp = [...this.memoryArr];

      this.chartOptions.series = [{ data: temp }];
      this.chart.updateOptions(
        {
          xaxis: {
            categories: tempTime.length > 12 ? tempTime.slice(-12) : tempTime,
          },
        },
        false,
        true
      );
    }, 1000 * 2);
  }

  async updateNetwork() {
    let temp = [];
    let tempTime = [];
    let data;
    if (!this.selectedMap || this.networkTimeInterval) return;
    this.clearAllIntervals(this.networkTimeInterval);
    this.networkTimeInterval = setInterval(async () => {
      data = await this.fetchSeriesData('network'); // data.cpuUtil..
      this.networkArr.push(data.networkStat);
      tempTime.push(new Date().toLocaleTimeString()); // yet to take..
      if (this.networkArr.length > 12) temp = this.networkArr.slice(-12);
      else temp = [...this.networkArr];

      this.chartOptions.series = [{ data: temp }];
      this.chart.updateOptions(
        {
          xaxis: {
            categories: tempTime.length > 12 ? tempTime.slice(-12) : tempTime,
          },
        },
        false,
        true
      );
    }, 1000 * 2);
  }

  async updateIdleTime() {
    let temp = [];
    let tempTime = [];
    let data;
    if (!this.selectedMap || this.idleTimeInterval) return;
    this.clearAllIntervals(this.idleTimeInterval);
    this.idleTimeInterval = setInterval(async () => {
      data = await this.fetchSeriesData('idle-time'); // data.cpuUtil..
      this.idleTimeArr.push(data.idleTime);
      tempTime.push(new Date().toLocaleTimeString()); // yet to take..
      if (this.idleTimeArr.length > 12) temp = this.idleTimeArr.slice(-12);
      else temp = [...this.idleTimeArr];

      this.chartOptions.series = [{ data: temp }];
      this.chart.updateOptions(
        {
          xaxis: {
            categories: tempTime.length > 12 ? tempTime.slice(-12) : tempTime,
          },
        },
        false,
        true
      );
    }, 1000 * 2);
  }

  async updateErr() {
    let temp = [];
    let tempTime = [];
    let data;
    if (!this.selectedMap || this.errTimeInterval) return;
    this.clearAllIntervals(this.errTimeInterval);
    this.errTimeInterval = setInterval(async () => {
      data = await this.fetchSeriesData('robo-err'); // data.cpuUtil..
      this.errorArr.push(data.roboErr);
      tempTime.push(new Date().toLocaleTimeString()); // yet to take..
      if (this.errorArr.length > 12) temp = this.errorArr.slice(-12);
      else temp = [...this.errorArr];

      this.chartOptions.series = [{ data: temp }];
      this.chart.updateOptions(
        {
          xaxis: {
            categories: tempTime.length > 12 ? tempTime.slice(-12) : tempTime,
          },
        },
        false,
        true
      );
    }, 1000 * 2);
  }

  clearAllIntervals(currInterval: any) {
    if (currInterval !== this.cpuUtilTimeInterval) {
      clearInterval(this.cpuUtilTimeInterval);
      this.cpuUtilTimeInterval = 0;
    }
    if (currInterval !== this.roboUtilTimeInterval) {
      clearInterval(this.roboUtilTimeInterval);
      this.roboUtilTimeInterval = 0;
    }
    if (currInterval !== this.batteryTimeInterval) {
      clearInterval(this.batteryTimeInterval);
      this.batteryTimeInterval = 0;
    }
    if (currInterval !== this.memoryTimeInterval) {
      clearInterval(this.memoryTimeInterval);
      this.memoryTimeInterval = 0;
    }
    if (currInterval !== this.networkTimeInterval) {
      clearInterval(this.networkTimeInterval);
      this.networkTimeInterval = 0;
    }
    if (currInterval !== this.idleTimeInterval) {
      clearInterval(this.idleTimeInterval);
      this.idleTimeInterval = 0;
    }
    if (currInterval !== this.errTimeInterval) {
      clearInterval(this.errTimeInterval);
      this.errTimeInterval = 0;
    }
  }
}
