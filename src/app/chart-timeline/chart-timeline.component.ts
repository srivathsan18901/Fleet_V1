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
  // @ViewChild('chart') chart: ChartComponent | undefined;
  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: ChartOptions;

  selectedMetric: string = 'CPU Utilization';
  selectedMap: any | null = null;
  currentFilter: any | null = null;

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
    if (!this.selectedMap) {
      console.log('no map has been selected!');
      return;
    }
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

  applyFilter(event: any) {
    this.currentFilter = event.target.value.toLowerCase();

    // this.intervals.forEach((interval) => {
    //   if (this[interval]) {
    if (this.selectedMetric === 'CPU Utilization')
      this.updateChart('data1', this.selectedMetric);
    else if (this.selectedMetric === 'Robot Utilization')
      this.updateChart('data2', this.selectedMetric);
    else if (this.selectedMetric === 'Battery')
      this.updateChart('data3', this.selectedMetric);
    else if (this.selectedMetric === 'Memory')
      this.updateChart('data4', this.selectedMetric);
    else if (this.selectedMetric === 'Network')
      this.updateChart('data5', this.selectedMetric);
    else if (this.selectedMetric === 'Idle Time')
      this.updateChart('data6', this.selectedMetric);
    else this.updateChart('data7', this.selectedMetric);
    // return;
    // }
    // });
  }

  plotChart(seriesName: string, data: any[], time: any[], limit: number = 12) {
    const limitedData = data.length > limit ? data.slice(-limit) : data;
    const limitedTime = time.length > limit ? time.slice(-limit) : time;

    // this.chartOptions.series = [{ name: seriesName, data: limitedData }];
    this.chart.updateOptions(
      {
        series: [{ name: seriesName, data: limitedData }],
        xaxis: { categories: limitedTime },
      },
      false, // Don't replot the entire chart
      true // Smooth transitions
    );
  }

  async fetchChartData( endpoint: string, timeSpan: string, startTime: string, endTime: string ) {
    // alter to date..
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/graph/${endpoint}/${this.selectedMap.id}`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSpan: timeSpan, // e.g. 'Daily' or 'Weekly'
          startTime: startTime,
          endTime: endTime,
        }),
      }
    );
    return await response.json();
  }

  async updateCpuUtil() {
    // this.chartOptions.xaxis.range = 12; // get use of it..
    this.clearAllIntervals(this.cpuUtilTimeInterval);
    if (this.currentFilter === 'week' || this.currentFilter === 'month') {
      clearInterval(this.cpuUtilTimeInterval);
      this.cpuUtilTimeInterval = 0;
      const data = await this.fetchChartData( 'cpu-utilization', this.currentFilter, '', '' );
      if (data.cpuUtil) {
        this.cpuUtilArr = data.cpuUtil.map((stat: any) => stat.rate);
        this.cpuXaxisSeries = data.cpuUtil.map( (stat: any) => stat.time );
      }
      this.plotChart( 'Throughput', this.cpuUtilArr, this.cpuXaxisSeries, 30 );
      return;
    }

    if (this.cpuUtilTimeInterval) return;

    const data = await this.fetchChartData( 'cpu-utilization', this.currentFilter, '', '' );
    if (data.cpuUtil) {
      this.cpuUtilArr = data.cpuUtil.map((stat: any) => stat.rate);
      this.cpuXaxisSeries = data.cpuUtil.map( (stat: any) => stat.time );
    }
    this.plotChart( 'Throughput', this.cpuUtilArr, this.cpuXaxisSeries );

    this.cpuUtilTimeInterval = setInterval(async () => {
      const data = await this.fetchChartData( 'cpu-utilization', this.currentFilter, '', '' );
      if (data.cpuUtil) {
        this.cpuUtilArr = data.cpuUtil.map((stat: any) => stat.rate);
        this.cpuXaxisSeries = data.cpuUtil.map( (stat: any) => stat.time );
      }
      this.plotChart( 'Throughput', this.cpuUtilArr, this.cpuXaxisSeries );
    }, 1000 * 2);
  }

  async updateRoboUtil() {
    // this.chartOptions.xaxis.range = 12; // get use of it..
    this.clearAllIntervals(this.roboUtilTimeInterval);
    if (this.currentFilter === 'week' || this.currentFilter === 'month') {
      clearInterval(this.roboUtilTimeInterval);
      this.roboUtilTimeInterval = 0;
      const data = await this.fetchChartData( 'robo-utilization', this.currentFilter, '', '' );
      if (data.roboUtil) {
        this.roboUtilArr = data.roboUtil.map((stat: any) => stat.rate);
        this.roboXaxisSeries = data.roboUtil.map( (stat: any) => stat.time );
      }
      this.plotChart( 'Robot Utilization', this.roboUtilArr, this.roboXaxisSeries, 30 );
      return;
    }

    if (this.roboUtilTimeInterval) return;

    const data = await this.fetchChartData( 'robo-utilization', this.currentFilter, '', '' );
    if (data.roboUtil) {
      this.roboUtilArr = data.roboUtil.map((stat: any) => stat.rate);
      this.roboXaxisSeries = data.roboUtil.map( (stat: any) => stat.time );
    }
    this.plotChart( 'Robot Utilization', this.roboUtilArr, this.roboXaxisSeries );

    this.roboUtilTimeInterval = setInterval(async () => {
      const data = await this.fetchChartData( 'robo-utilization', this.currentFilter, '', '' );
      if (data.roboUtil) {
        this.roboUtilArr = data.roboUtil.map((stat: any) => stat.rate);
        this.roboXaxisSeries = data.roboUtil.map( (stat: any) => stat.time );
      }
      this.plotChart( 'Robot Utilization', this.roboUtilArr, this.roboXaxisSeries );
    }, 1000 * 2);
  }

  async updateBattery() {
    this.clearAllIntervals(this.batteryTimeInterval);
    if (this.currentFilter === 'week' || this.currentFilter === 'month') {
      clearInterval(this.batteryTimeInterval);
      this.batteryTimeInterval = 0;
      const data = await this.fetchChartData( 'battery', this.currentFilter, '', '' );
      if (data.batteryStat) {
        this.batteryArr = data.batteryStat.map((stat: any) => stat.rate);
        this.batteryXaxisSeries = data.batteryStat.map( (stat: any) => stat.time );
      }
      this.plotChart( 'Battery', this.batteryArr, this.batteryXaxisSeries, 30 );
      return;
    }

    if (this.batteryTimeInterval) return;

    const data = await this.fetchChartData( 'battery', this.currentFilter, '', '' );
    if (data.batteryStat) {
      this.batteryArr = data.batteryStat.map((stat: any) => stat.rate);
      this.batteryXaxisSeries = data.batteryStat.map( (stat: any) => stat.time );
    }
    this.plotChart( 'Battery', this.batteryArr, this.batteryXaxisSeries );

    this.batteryTimeInterval = setInterval(async () => {
    const data = await this.fetchChartData( 'battery', this.currentFilter, '', '' );
    if (data.batteryStat) {
      this.batteryArr = data.batteryStat.map((stat: any) => stat.rate);
      this.batteryXaxisSeries = data.batteryStat.map( (stat: any) => stat.time );
    }
    this.plotChart( 'Battery', this.batteryArr, this.batteryXaxisSeries );
    }, 1000 * 2);
  }

  async updateMemory() {
    this.clearAllIntervals(this.memoryTimeInterval);
    if (this.currentFilter === 'week' || this.currentFilter === 'month') {
      clearInterval(this.memoryTimeInterval);
      this.memoryTimeInterval = 0;
      const data = await this.fetchChartData( 'memory', this.currentFilter, '', '' );
      if (data.memoryStat) {
        this.memoryArr = data.memoryStat.map((stat: any) => stat.rate);
        this.memoryXaxisSeries = data.memoryStat.map( (stat: any) => stat.time );
      }
      this.plotChart( 'Memory', this.memoryArr, this.memoryXaxisSeries, 30 );
      return;
    }

    if (this.memoryTimeInterval) return;

    const data = await this.fetchChartData( 'memory', this.currentFilter, '', '' );
      if (data.memoryStat) {
        this.memoryArr = data.memoryStat.map((stat: any) => stat.rate);
        this.memoryXaxisSeries = data.memoryStat.map( (stat: any) => stat.time );
      }
      this.plotChart( 'Memory', this.memoryArr, this.memoryXaxisSeries );

    this.memoryTimeInterval = setInterval(async () => {
      const data = await this.fetchChartData( 'memory', this.currentFilter, '', '' );
      if (data.memoryStat) {
        this.memoryArr = data.memoryStat.map((stat: any) => stat.rate);
        this.memoryXaxisSeries = data.memoryStat.map( (stat: any) => stat.time );
      }
      this.plotChart( 'Memory', this.memoryArr, this.memoryXaxisSeries);
    }, 1000 * 2);
  }

  async updateNetwork() {
    this.clearAllIntervals(this.networkTimeInterval);
    if (this.currentFilter === 'week' || this.currentFilter === 'month') {
      clearInterval(this.networkTimeInterval);
      this.networkTimeInterval = 0;
      const data = await this.fetchChartData( 'network', this.currentFilter, '', '' );
      if (data.networkStat) {
        this.networkArr = data.networkStat.map((stat: any) => stat.rate);
        this.networkXaxisSeries = data.networkStat.map( (stat: any) => stat.time );
      }
      this.plotChart( 'Network', this.networkArr, this.networkXaxisSeries, 30 );
      return;
    }

    if (this.networkTimeInterval) return;

    const data = await this.fetchChartData( 'network', this.currentFilter, '', '' );
      if (data.networkStat) {
        this.networkArr = data.networkStat.map((stat: any) => stat.rate);
        this.networkXaxisSeries = data.networkStat.map( (stat: any) => stat.time );
      }
      this.plotChart( 'Network', this.networkArr, this.networkXaxisSeries );
    this.networkTimeInterval = setInterval(async () => {
      const data = await this.fetchChartData( 'network', this.currentFilter, '', '' );
      if (data.networkStat) {
        this.networkArr = data.networkStat.map((stat: any) => stat.rate);
        this.networkXaxisSeries = data.networkStat.map( (stat: any) => stat.time );
      }
      this.plotChart( 'Network', this.networkArr, this.networkXaxisSeries );
    }, 1000 * 2);
  }

  async updateIdleTime() {
    this.clearAllIntervals(this.idleTimeInterval);
    if (this.currentFilter === 'week' || this.currentFilter === 'month') {
      clearInterval(this.idleTimeInterval);
      this.idleTimeInterval = 0;
      const data = await this.fetchChartData( 'idle-time', this.currentFilter, '', '' );
      if (data.idleTime) {
        this.idleTimeArr = data.idleTime.map((stat: any) => stat.rate);
        this.idleTimeXaxisSeries = data.idleTime.map( (stat: any) => stat.time );
      }
      this.plotChart( 'Idle Time', this.idleTimeArr, this.idleTimeXaxisSeries, 30 );
      return;
    }

    if (this.idleTimeInterval) return;

    const data = await this.fetchChartData( 'idle-time', this.currentFilter, '', '' );
      if (data.idleTime) {
        this.idleTimeArr = data.idleTime.map((stat: any) => stat.rate);
        this.idleTimeXaxisSeries = data.idleTime.map( (stat: any) => stat.time );
      }
      this.plotChart( 'Idle Time', this.idleTimeArr, this.idleTimeXaxisSeries );

    this.idleTimeInterval = setInterval(async () => {
      const data = await this.fetchChartData( 'idle-time', this.currentFilter, '', '' );
      if (data.idleTime) {
        this.idleTimeArr = data.idleTime.map((stat: any) => stat.rate);
        this.idleTimeXaxisSeries = data.idleTime.map( (stat: any) => stat.time );
      }
      this.plotChart( 'Idle Time', this.idleTimeArr, this.idleTimeXaxisSeries );
    }, 1000 * 2);
  }

  async updateErr() {
    this.clearAllIntervals(this.errTimeInterval);
    if (this.currentFilter === 'week' || this.currentFilter === 'month') {
      clearInterval(this.errTimeInterval);
      this.errTimeInterval = 0;
      const data = await this.fetchChartData( 'robo-err', this.currentFilter, '', '' );
      if (data.roboErr) {
        this.errorArr = data.roboErr.map((stat: any) => stat.rate);
        this.errRateXaxisSeries = data.roboErr.map( (stat: any) => stat.time );
      }
      this.plotChart( 'Error', this.errorArr, this.errRateXaxisSeries, 30 );
      return;
    }

    if (this.errTimeInterval) return;

    const data = await this.fetchChartData( 'robo-err', this.currentFilter, '', '' );
      if (data.roboErr) {
        this.errorArr = data.roboErr.map((stat: any) => stat.rate);
        this.errRateXaxisSeries = data.roboErr.map( (stat: any) => stat.time );
      }
      this.plotChart( 'Error', this.errorArr, this.errRateXaxisSeries );

    this.errTimeInterval = setInterval(async () => {
      const data = await this.fetchChartData( 'robo-err', this.currentFilter, '', '' );
      if (data.roboErr) {
        this.errorArr = data.roboErr.map((stat: any) => stat.rate);
        this.errRateXaxisSeries = data.roboErr.map( (stat: any) => stat.time );
      }
      this.plotChart( 'Error', this.errorArr, this.errRateXaxisSeries );
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
