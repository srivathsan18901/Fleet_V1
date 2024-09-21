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

  selectedMap: any | null = null;
  throughputArr: number[] = [];
  x_axis_timeStamp: string[] = [];

  constructor(
    private projectService: ProjectService,
    private cdRef: ChangeDetectorRef
  ) {
    const seriesData = {
      hourlyDataSeries1: {
        picks: [0], // 110, 91, 55, 101, 129, 122, 69, 91, 148
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
          data: this.seriesData,
          color: '#ff7373', // Using preferred color
        },
      ],
      chart: {
        type: 'area',
        height: 225, // Set height
        width: 440, // Set width
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
          fontSize: '18px',
        },
      },
      subtitle: {
        text: 'Picks Per Hour',
        align: 'left',
        style: {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontWeight: 'bold',
          fontSize: '10px',
          color: '#FF3333',
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

  ngOnInit() {
    this.selectedMap = this.projectService.getMapData();
    if (!this.ONBtn) return;
    this.getThroughPut();
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
          categories: this.x_axis_timeStamp,
        },
      };
      return;
    }
    this.getThroughPut();
  }

  async getThroughPut() {
    if (!this.selectedMap) return;
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/graph/throughput/${this.selectedMap.id}`,
      {
        method: 'POST',
        credentials: 'include',
      }
    );
    const data = await response.json();

    if (data.throughput && data.throughput.Stat)
      this.throughputArr = data.throughput.Stat.map((stat: any) => {
        let time = new Date(stat.TimeStamp).toLocaleString('en-IN', {
          // month: 'short',
          // year: 'numeric',
          // day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        });

        // x_axis_timeStamp = [...x_axis_timeStamp, time];
        this.x_axis_timeStamp.push(time);
        return stat.TotalThroughPutPerHour;
      });
    console.log(this.throughputArr, this.x_axis_timeStamp);

    this.chartOptions = {
      ...this.chartOptions,
      series: [
        {
          name: 'Throughput',
          data: this.throughputArr,
          color: '#ff7373',
        },
      ],
      xaxis: {
        // ...this.chartOptions.xaxis, // only if needed..
        categories: this.x_axis_timeStamp,
      },
    };

    this.cdRef.detectChanges();
  }
}
