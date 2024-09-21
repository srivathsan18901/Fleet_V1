import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexFill,
  ApexDataLabels,
  ApexYAxis,
  ApexTooltip,
  ApexGrid,
  ApexStroke,
  ChartComponent,
} from 'ng-apexcharts';
import { environment } from '../../environments/environment.development';
import { ProjectService } from '../services/project.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  fill: ApexFill;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  grid: ApexGrid;
};

@Component({
  selector: 'app-area-chart',
  templateUrl: './area-chart.component.html',
  styleUrls: ['./area-chart.component.css'],
})
export class AreaChartComponent implements OnInit {

 currentFilter: string = 'today'; // To track the selected filter

  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: ChartOptions;
  selectedMetric: string = 'Throughput'; // Default value
  selectedMap: any | null = null;

  throughputArr: number[] = [0];
  throughputXaxisSeries: string[] = [];

  starvationArr: number[] = [0];
  starvationXaxisSeries: string[] = [];

  pickAccuracyArr: number[] = [0];
  pickAccXaxisSeries: string[] = [];

  errRateArr: number[] = [0];
  errRateXaxisSeries: string[] = [];

  throuputTimeInterval: any | null = null;
  starvationTimeInterval: any | null = null;
  taskAllocationTimeInterval: any | null = null;
  pickAccTimeInterval: any | null = null;
  errRateTimeInterval: any | null = null;

  constructor(
    private projectService: ProjectService,
    private cdRef: ChangeDetectorRef
  ) {
    this.chartOptions = {
      series: [
        {
          name: '',
          data: this.throughputArr,
        },
      ],
      chart: {
        height: 250,
        type: 'area',
        background: '#FFFFFF',
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
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.5,
          opacityTo: 0.9,
          stops: [0, 100],
          colorStops: [
            {
              offset: 0,
              color: '#32CD32',
              opacity: 0.5,
            },
            {
              offset: 100,
              color: '#32CD3200',
              opacity: 0.1,
            },
          ],
        },
      },
      dataLabels: {
        enabled: true,
      },
      stroke: {
        curve: 'smooth',
        width: 3,
        colors: ['#32CD32'], // This is the key change: making sure the stroke is red
      },
      tooltip: {
        enabled: true,
        theme: 'dark',
        x: {
          format: 'dd MMM',
        },
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

  ngOnInit(): void {
    this.selectedMap = this.projectService.getMapData();
    this.updateChart('data1', 'Throughput');
  }

  updateChart(dataKey: string, metricName: string): void {
    this.selectedMetric = metricName; // Update the displayed metric name

    switch (dataKey) {
      case 'data1':
        this.updateThroughput();
        break;
      case 'data2':
        this.updateStarvationRate();
        break;
      case 'data3':
        this.updateTaskAllocation();
        break;
      case 'data4':
        this.updatePickAccuracy();
        break;
      case 'data5':
        this.updateErrorRate();
        break;
    }
  }

   // Apply filter function when a filter is selected
   applyFilter(filter: string) {
    this.currentFilter = filter; // Update the current filter
    this.updateChartWithFilter(); // Re-fetch data with the new filter
  }
  updateChartWithFilter() {
    throw new Error('Method not implemented.');
  }
  async updateThroughput() {
    if (!this.selectedMap || this.throuputTimeInterval) return;
    this.clearAllIntervals(this.throuputTimeInterval);

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
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        });

        this.throughputXaxisSeries = [...this.throughputXaxisSeries, time];
        // this.throughputXaxisSeries.push(time);
        return stat.TotalThroughPutPerHour;
      });

    this.chartOptions.series = [{ data: this.throughputArr }];
    this.chartOptions.xaxis = { categories: this.throughputXaxisSeries };

    // this.cdRef.detectChanges();
  }

  async updateStarvationRate() {
    let temp = [];
    let tempTime = [];
    if (!this.selectedMap || this.starvationTimeInterval) return;
    this.clearAllIntervals(this.starvationTimeInterval);
    this.chartOptions.xaxis.range = 12;
    let startTime = new Date().setHours(0, 0, 0, 0); // set current time to starting time of the current day..
    let endTime = new Date().setMilliseconds(0); // time in milliseconds..

    try {
      this.starvationTimeInterval = setInterval(async () => {
        let response = await fetch(
          `http://${environment.API_URL}:${environment.PORT}/graph/starvationrate/${this.selectedMap.id}`,
          {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({
              timeSpan: 'Daily', // Weekly
              startTime: startTime,
              endTime: endTime,
            }),
          }
        );
        let data = await response.json();
        if (!data.map) {
          clearInterval(this.starvationTimeInterval);
          return;
        }

        this.starvationArr.push(data.starvation);
        tempTime.push(new Date().toLocaleTimeString()); // yet to take..
        if (this.starvationArr.length > 12)
          temp = this.starvationArr.slice(-12);
        else temp = [...this.starvationArr];

        this.chartOptions.series = [{ data: temp }];
        this.chart.updateOptions(
          {
            // series: [{ data: temp }],
            xaxis: {
              categories: tempTime.length > 12 ? tempTime.slice(-12) : tempTime,
            },
          },
          false, // Do not completely replot the chart
          true // Allow smooth transitions
        );
      }, 1000 * 2);
    } catch (err) {
      console.log('Err occured here : ', err);
    }
  }

  // yet to remove..
  async updateTaskAllocation() {
    if (!this.selectedMap || this.taskAllocationTimeInterval) return;
    this.clearAllIntervals(this.taskAllocationTimeInterval);
    this.chartOptions.series = [
      {
        name: 'Series 3',
        data: [35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85],
      },
    ];
    this.chartOptions.xaxis.categories = [
      'Dec 01',
      'Dec 02',
      'Dec 03',
      'Dec 04',
      'Dec 05',
      'Dec 06',
      'Dec 07',
      'Dec 08',
      'Dec 09',
      'Dec 10',
      'Dec 11',
    ];
  }

  async updatePickAccuracy() {
    let temp = [];
    let tempTime = [];
    if (!this.selectedMap || this.pickAccTimeInterval) return;
    this.clearAllIntervals(this.pickAccTimeInterval);
    this.chartOptions.xaxis.range = 12;
    let startTime = new Date().setHours(0, 0, 0, 0); // set current time to starting time of the current day..
    let endTime = new Date().setMilliseconds(0); // time in milliseconds..

    try {
      this.pickAccTimeInterval = setInterval(async () => {
        let response = await fetch(
          `http://${environment.API_URL}:${environment.PORT}/graph/pickaccuracy/${this.selectedMap.id}`,
          {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({
              timeSpan: 'Daily', // Weekly
              startTime: startTime,
              endTime: endTime,
            }),
          }
        );
        let data = await response.json();
        if (!data.map) {
          clearInterval(this.pickAccTimeInterval);
          return;
        }

        this.pickAccuracyArr.push(data.pickAccuracy);
        tempTime.push(new Date().toLocaleTimeString()); // yet to take..
        if (this.pickAccuracyArr.length > 12)
          temp = this.pickAccuracyArr.slice(-12);
        else temp = [...this.pickAccuracyArr];

        this.chartOptions.series = [{ data: temp }];
        this.chart.updateOptions(
          {
            // series: [{ data: temp }],
            xaxis: {
              categories: tempTime.length > 12 ? tempTime.slice(-12) : tempTime,
            },
          },
          false, // Do not completely replot the chart
          true // Allow smooth transitions
        );
      }, 1000 * 2);
    } catch (err) {
      console.log('Err occured here : ', err);
    }
  }

  async updateErrorRate() {
    let temp = [];
    let tempTime = [];
    if (!this.selectedMap || this.errRateTimeInterval) return;
    this.clearAllIntervals(this.errRateTimeInterval);
    this.chartOptions.xaxis.range = 12;
    let startTime = new Date().setHours(0, 0, 0, 0); // set current time to starting time of the current day..
    let endTime = new Date().setMilliseconds(0); // time in milliseconds..

    try {
      this.errRateTimeInterval = setInterval(async () => {
        let response = await fetch(
          `http://${environment.API_URL}:${environment.PORT}/graph/err-rate/${this.selectedMap.id}`,
          {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({
              timeSpan: 'Daily', // Weekly
              startTime: startTime,
              endTime: endTime,
            }),
          }
        );
        let data = await response.json();
        if (!data.map) {
          clearInterval(this.errRateTimeInterval);
          return;
        }

        this.errRateArr.push(data.errRate);
        tempTime.push(new Date().toLocaleTimeString()); // yet to take..
        if (this.errRateArr.length > 12) temp = this.errRateArr.slice(-12);
        else temp = [...this.errRateArr];

        this.chartOptions.series = [{ data: temp }];
        this.chart.updateOptions(
          {
            // series: [{ data: temp }],
            xaxis: {
              categories: tempTime.length > 12 ? tempTime.slice(-12) : tempTime,
            },
          },
          false, // Do not completely replot the chart
          true // Allow smooth transitions
        );
      }, 1000 * 2);
    } catch (err) {
      console.log('Err occured here : ', err);
    }
  }

  clearAllIntervals(currInterval: any) {
    if (currInterval !== this.throuputTimeInterval) {
      clearInterval(this.throuputTimeInterval);
      this.throuputTimeInterval = 0;
    }
    if (currInterval !== this.starvationTimeInterval) {
      clearInterval(this.starvationTimeInterval);
      this.starvationTimeInterval = 0;
    }
    if (currInterval !== this.taskAllocationTimeInterval) {
      clearInterval(this.taskAllocationTimeInterval);
      this.taskAllocationTimeInterval = 0;
    }
    if (currInterval !== this.pickAccTimeInterval) {
      clearInterval(this.pickAccTimeInterval);
      this.pickAccTimeInterval = 0;
    }
    if (currInterval !== this.errRateTimeInterval) {
      clearInterval(this.errRateTimeInterval);
      this.errRateTimeInterval = 0;
    }
  }
}
