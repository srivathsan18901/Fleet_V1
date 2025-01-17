import { Component, ViewChild, Input, ChangeDetectorRef } from '@angular/core';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexYAxis,
  ApexTitleSubtitle,
  ApexLegend,
} from 'ng-apexcharts';
import { ProjectService } from '../services/project.service';
import { environment } from '../../environments/environment.development';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  yaxis: ApexYAxis;
  title: ApexTitleSubtitle;
  labels: string[];
  legend: ApexLegend;
  subtitle: ApexTitleSubtitle;
  colors: string[];
};

@Component({
  selector: 'app-throughput',
  templateUrl: './throughput.component.html',
  styleUrls: ['./throughput.component.css'],
})
export class ThroughputComponent {
  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  public averagePercentage: number = 0;
  @Input() ONBtn!: boolean;

  seriesData: any[] = [];
  currentFilter: string = 'today';
  isInLive: boolean = false;

  selectedMap: any | null = null;
  throughputArr: number[] = [0];
  throughputXaxisSeries: string[] = [];

  throuputTimeInterval: any | null = null;

  constructor(
    private projectService: ProjectService,
    private cdRef: ChangeDetectorRef
  ) {
    const seriesData = {
      hourlyDataSeries1: {
        picks: [0, 110, 91, 55, 101, 129, 122, 69, 91, 148],
        datestime: [],
      },
    };

    const totalPicks = seriesData.hourlyDataSeries1.picks.reduce(
      (acc, val) => acc + val,
      0
    );
    const numberOfDataPoints = seriesData.hourlyDataSeries1.picks.length;
    this.averagePercentage = totalPicks / numberOfDataPoints;

    this.chartOptions = {
      series: [
        {
          name: 'Picks',
          data: this.throughputArr,
          color: '#F71717', // Using preferred color
        },
      ],
      chart: {
        type: 'area',
        height: 225, // Set height
        width: 520, // Set width
        offsetY: 5,
        offsetX: 10,
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
      },
      title: {
        text: 'ThroughPut',
        align: 'left',
        style: {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontWeight: 'bold',
          fontSize: '20px',
        },
      },
      subtitle: {
        text: 'Picks Per Hour',
        align: 'left',
        style: {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontWeight: 'semibold',
          fontSize: '12px',
          color: '#959494',
        },
      },
      labels: seriesData.hourlyDataSeries1.datestime,
      xaxis: {
        type: 'datetime',
        tickAmount: 10,
        labels: {
          format: 'HH:mm',
        },
      },
      yaxis: {
        opposite: true,
      },
      legend: {
        horizontalAlign: 'left',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontWeight: 'bold',
        fontSize: '8px',
      },
    };
  }

  async ngOnInit() {
    this.selectedMap = this.projectService.getMapData();
    this.isInLive = this.projectService.getInLive();
    if (!this.isInLive) return;
    await this.updateThroughput();
  }

  getThroughPutIfOn() {
    if (this.ONBtn) {
      // alter the logic, cz of toggling function in button..
      // this.chartOptions.series = [0];
      this.chartOptions = {
        ...this.chartOptions,
        series: [
          {
            name: 'Throughput',
            data: [0],
            color: '#ff7373',
          },
        ],
        xaxis: {
          // ...this.chartOptions.xaxis, // only if needed..
          categories: this.throughputXaxisSeries,
        },
      };
      return;
    }
    // this.getThroughPut();
  }

  plotChart(seriesName: string, data: any[], time: any[], limit: number = 5) {
    // limit: number = 12
    const limitedData = data.length > limit ? data.slice(-limit) : data;
    const limitedTime = time.length > limit ? time.slice(-limit) : time;

    this.chartOptions = {
      ...this.chartOptions,
      series: [{ name: 'Throughput', data: limitedData, color: '#ff7373' }],
      xaxis: {
        // ...this.chartOptions.xaxis, // only if needed..
        categories: limitedTime,
      },
    };
  }

  async fetchChartData(
    endpoint: string,
    timeSpan: string,
    startTime: string,
    endTime: string
  ) {
    // alter to date..
    let { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay();
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/graph/${endpoint}/${this.selectedMap.id}`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSpan: timeSpan, // e.g. 'Daily' or 'Weekly'
          timeStamp1: timeStamp1,
          timeStamp2: timeStamp2,
        }),
      }
    );
    return await response.json();
  }

  async updateThroughput() {
    // this.chartOptions.xaxis.range = 12; // get use of it..
    this.clearTroughputInterval();

    if (this.throuputTimeInterval) return;

    const data = await this.fetchChartData(
      'throughput',
      this.currentFilter,
      '',
      ''
    );

    let { Stat } = data.throughput;
    // console.log(Stat);

    if (data.throughput) {
      // this.throughputArr = data.throughput.map((stat: any) => stat.rate);
      this.throughputArr = Stat.map((stat: any) => stat.TotalThroughPutPerHour);
      this.throughputXaxisSeries = Stat.map(
        // (stat: any) => stat.time
        (stat: any) =>
          new Date().toLocaleString('en-IN', {
            // month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          })
      );
    }
    this.plotChart(
      'Throughput',
      this.throughputArr,
      this.throughputXaxisSeries
    ); // this.selectedMetric..

    this.throuputTimeInterval = setInterval(async () => {
      const data = await this.fetchChartData(
        'throughput',
        this.currentFilter,
        '',
        ''
      );
      let { Stat } = data.throughput;

      if (data.throughput) {
        this.throughputArr = Stat.map(
          (stat: any) => stat.TotalThroughPutPerHour
        );
        this.throughputXaxisSeries = Stat.map((stat: any) =>
          new Date().toLocaleString('en-IN', {
            // month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          })
        );
      }

      this.plotChart(
        'Throughput',
        this.throughputArr,
        this.throughputXaxisSeries
      );
    }, 1000 * 60); // 60 * 60
  }

  getTimeStampsOfDay() {
    let currentTime = Math.floor(new Date().getTime() / 1000);
    let startTimeOfDay = this.getStartOfDay();
    return {
      timeStamp1: startTimeOfDay,
      timeStamp2: currentTime,
    };
  }

  getStartOfDay() {
    return Math.floor(new Date().setHours(0, 0, 0) / 1000);
  }

  clearTroughputInterval() {
    clearInterval(this.throuputTimeInterval);
    // this.throuputTimeInterval = 0; // yet to uncomment.. if in case of local logic..
  }

  ngOnDestroy() {
    if (this.throuputTimeInterval) clearInterval(this.throuputTimeInterval);
  }
}
