import {
  ChangeDetectorRef,
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ViewChild,
} from '@angular/core';
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
import { TranslationService } from '../services/translation.service';
import { ExportFileService } from '../services/export-file.service';

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

interface imageURI {
  metricName: string;
  base64URI: string;
}

@Component({
  selector: 'app-area-chart',
  templateUrl: './area-chart.component.html',
  styleUrls: ['./area-chart.component.css'],
})
export class AreaChartComponent implements OnInit {
  currentFilter: string = 'today'; // To track the selected filter

  @Output() systemThroughputEvent = new EventEmitter<any>();
  @ViewChild('chart') chart!: ChartComponent;
  @ViewChild('chartInstance') chartInstance!: ChartComponent;
  public chartOptions: ChartOptions;
  selectedMetric: string = 'Throughput'; // Default value
  translatedMetric: string = '';
  selectedMap: any | null = null;
  isFleetUp: boolean = false;

  private abortControllers: Map<string, AbortController> = new Map();

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
  pickAccTimeInterval: any | null = null;
  errRateTimeInterval: any | null = null;

  @Input() taskData: any[] = [];

  imageURIs: imageURI[] = [];

  constructor(
    private projectService: ProjectService,
    private cdRef: ChangeDetectorRef,
    private translationService: TranslationService,
    private exportFileService: ExportFileService
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
        toolbar: {
          show: true, // Keep the toolbar visible
          tools: {
            download: false,
          },
        },
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
        custom: ({ seriesIndex, dataPointIndex, w }) => {
          const value = w.config.series[seriesIndex].data[dataPointIndex];
          const category = w.config.xaxis.categories[dataPointIndex];

          // Assuming 'metricName' is translated dynamically, here's how you can use it:
          const translatedMetric = this.getTranslation(this.selectedMetric); // Get translation for the metric

          return `
            <div style="padding: 10px; background: #333; color: #fff;">
              <strong>${translatedMetric}</strong>: ${value}<br>
            </div>
          `;
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
    this.projectService.isFleetUp$.subscribe((status) => {
      this.isFleetUp = status;
    });
    this.updateChart('data1', 'Throughput');
  }

  getTranslation(key: string) {
    const translation = this.translationService.getStatisticsTranslation(key);
    // console.log(`Translating key: ${key} => ${translation}`);
    return translation;
  }

  updateChart(dataKey: string, metricName: string): void {
    if (!this.selectedMap) {
      console.log('no map has been selected!');
      return;
    }
    this.selectedMetric = metricName; // Update the displayed metric name

    switch (dataKey) {
      case 'data1':
        this.updateThroughput();
        break;
      case 'data2':
        this.updateStarvationRate();
        break;
      case 'data3':
        this.updatePickAccuracy();
        break;
      case 'data4':
        this.updateErrorRate();
        break;
    }
  }

  applyFilter(event: any) {
    this.currentFilter = event.target.value.toLowerCase();
    this.exportFileService.setCurrentFilter(this.currentFilter);

    if (this.selectedMetric === 'Throughput')
      this.updateChart('data1', this.selectedMetric);
    else if (this.selectedMetric === 'starvationRate')
      this.updateChart('data2', this.selectedMetric);
    else if (this.selectedMetric === 'pickAccuracy')
      this.updateChart('data3', this.selectedMetric);
    else if (this.selectedMetric === 'errorRate')
      this.updateChart('data4', this.selectedMetric);
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

  async fetchChartData(endpoint: string, timeSpan: string) {
    if (this.abortControllers.has(endpoint))
      this.abortControllers.get(endpoint)?.abort();

    const abortController = new AbortController(); // we can abort one or more requests as when we desired to..
    this.abortControllers.set(endpoint, abortController);

    try {
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
          signal: abortController.signal,
        }
      );

      return await response.json();
    } catch (error) {
      console.log('Error while fetching chart datum : ', error);
      return;
    } finally {
      this.abortControllers.delete(endpoint);
    }
  }

  async updateThroughput() {
    // this.chartOptions.xaxis.range = 7; // get use of it..

    this.clearAllIntervals(this.throuputTimeInterval);
    if (this.currentFilter === 'week' || this.currentFilter === 'month') {
      clearInterval(this.throuputTimeInterval);
      this.throuputTimeInterval = 0;
      const data = await this.fetchChartData('throughput', this.currentFilter);
      // console.log(data,'data')
      if (data.throughput) {
        this.throughputArr = data.throughput.Stat.map(
          (stat: any) => stat.TotalThroughPutPerHour
        );
        this.throughputXaxisSeries = data.throughput.Stat.map(
          (stat: any, index: any) => ++index
        );
      }
      // console.log('line 245')
      this.plotChart(
        'Throughput',
        this.throughputArr,
        this.throughputXaxisSeries,
        30
      );
      return;
    }

    if (this.throuputTimeInterval) return;

    const data = await this.fetchChartData('throughput', this.currentFilter);
    if (data && !data.throughput) return;
    let { Stat } = data.throughput;

    if (data.throughput) {
      this.throughputArr = Stat.map((stat: any) => stat.TotalThroughPutPerHour);
      this.throughputXaxisSeries = Stat.map(
        // (stat: any) => stat.time
        (stat: any, index: any) => ++index
        // new Date().toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', })
      );
      this.systemThroughputEvent.emit(this.throughputArr);
    }
    this.plotChart(
      'Throughput',
      this.throughputArr,
      this.throughputXaxisSeries
    ); // this.selectedMetric..

    this.throuputTimeInterval = setInterval(async () => {
      const data = await this.fetchChartData('throughput', this.currentFilter);
      if (data && !data.throughput) return;
      let { Stat } = data.throughput;

      if (data.throughput) {
        this.throughputArr = Stat.map(
          (stat: any) => stat.TotalThroughPutPerHour
        );
        this.throughputXaxisSeries = Stat.map(
          (stat: any, index: number) => ++index
        );
        this.systemThroughputEvent.emit(this.throughputArr);
      }
      // console.log('line 278')
      this.plotChart(
        'Throughput',
        this.throughputArr,
        this.throughputXaxisSeries
      );
    }, 1000 * 2); // 60 * 60
  }

  async updateStarvationRate() {
    this.clearAllIntervals(this.starvationTimeInterval);

    if (this.currentFilter === 'week' || this.currentFilter === 'month') {
      clearInterval(this.starvationTimeInterval);
      this.starvationTimeInterval = 0;
      const data = await this.fetchChartData(
        'starvationrate',
        this.currentFilter
      );
      console.log(data, 'data starvation');

      if (data.starvation) {
        this.starvationArr = data.starvation.map((stat: any) => {
          return Math.round(stat.starvationRate);
        });
        this.starvationXaxisSeries = data.starvation.map(
          (stat: any, index: any) => ++index
        );
      }
      this.plotChart(
        'Starvation rate',
        this.starvationArr,
        this.starvationXaxisSeries,
        30
      );
      return;
    }

    if (this.starvationTimeInterval) return;

    const data = await this.fetchChartData(
      'starvationrate',
      this.currentFilter
    );

    if (data.starvation) {
      this.starvationArr = data.starvation.map((stat: any) => {
        return Math.round(stat.starvationRate);
      });
      this.starvationXaxisSeries = data.starvation.map(
        (stat: any, index: any) => ++index
      );
    }

    this.plotChart(
      'Starvation rate',
      this.starvationArr,
      this.starvationXaxisSeries
    );

    this.starvationTimeInterval = setInterval(async () => {
      const data = await this.fetchChartData(
        'starvationrate',
        this.currentFilter
      );
      if (data.starvation) {
        this.starvationArr = data.starvation.map((stat: any) => {
          return Math.round(stat.starvationRate);
        });
        this.starvationXaxisSeries = data.starvation.map(
          (stat: any, index: any) => ++index
        );
      }
      //   // Plot the NOTASSIGNED percentage in the chart
      //   this.plotNotAssignedPercentage(data.notAssignedPercentage);
      // }
      this.plotChart(
        'Starvation rate',
        this.starvationArr,
        this.starvationXaxisSeries
      );
    }, 1000 * 2);
  }

  // Function to plot NOTASSIGNED percentage in the graph
  plotNotAssignedPercentage(percentage: number) {
    // Assuming you want to plot this value as a separate series in the chart
    // You may use a charting library like ApexCharts to add a new series
    this.chartOptions.series.push({
      name: 'NOTASSIGNED Percentage',
      data: [percentage], // You can adjust this to fit the timeline if needed
    });
    this.plotChart(
      'Starvation rate',
      this.starvationArr,
      this.starvationXaxisSeries
    );
  }

  async fetchPickAccuracyData(
    endpoint: string,
    timeSpan: string,
    startTime: string,
    endTime: string
  ) {
    let { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay();

    // Fetch data from the API
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-tasks`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSpan: timeSpan,
          timeStamp1: timeStamp1,
          timeStamp2: timeStamp2,
        }),
      }
    );

    const data = await response.json();

    // Assuming data contains a list of tasks
    if (data && data.tasks) {
      const totalTasks = data.tasks.length;
      const completedCount = data.tasks.filter(
        (task: any) => task.TaskStatus_Names === 'COMPLETED'
      ).length;

      const completedPercentage = (completedCount / totalTasks) * 100;

      // Return the data with the calculated COMPLETED percentage
      return { tasks: data.tasks, completedPercentage };
    }

    return { tasks: [], completedPercentage: 0 };
  }

  async updatePickAccuracy() {
    let startTime = new Date().setHours(0, 0, 0, 0); // Set current time to starting time of the current day..
    let endTime = new Date().setMilliseconds(0); // Time in milliseconds..

    this.clearAllIntervals(this.pickAccTimeInterval);

    if (this.currentFilter === 'week' || this.currentFilter === 'month') {
      clearInterval(this.pickAccTimeInterval);
      this.pickAccTimeInterval = 0;
      // console.log('pick');
      const data = await this.fetchChartData(
        'pickaccuracy',
        this.currentFilter
      );

      if (data.throughput) {
        this.pickAccuracyArr = data.throughput.Stat.map((stat: any) =>
          Math.round(stat.pickAccuracy)
        );
        this.pickAccXaxisSeries = data.throughput.Stat.map(
          (stat: any, index: any) => ++index
        );
      }

      this.plotChart(
        'Pick accuracy',
        this.pickAccuracyArr,
        this.pickAccXaxisSeries,
        30
      );
      return;
    }

    if (this.pickAccTimeInterval) return;

    // Fetch the data and calculate the COMPLETED percentage
    const data = await this.fetchChartData('pickaccuracy', this.currentFilter);
    if (data.throughput) {
      this.pickAccuracyArr = data.throughput.Stat.map((stat: any) =>
        Math.round(stat.pickAccuracy)
      );
      this.pickAccXaxisSeries = data.throughput.Stat.map(
        (stat: any, index: any) => ++index
      );
    }

    this.plotChart(
      'Pick accuracy',
      this.pickAccuracyArr,
      this.pickAccXaxisSeries
    );

    this.pickAccTimeInterval = setInterval(async () => {
      const data = await this.fetchChartData(
        'pickaccuracy',
        this.currentFilter
      );
      console.log(data, 'pick acc');
      if (data.throughput) {
        this.pickAccuracyArr = data.throughput.Stat.map((stat: any) =>
          Math.round(stat.pickAccuracy)
        );
        this.pickAccXaxisSeries = data.throughput.Stat.map(
          (stat: any, index: any) => ++index
        );
      }

      this.plotChart(
        'Pick accuracy',
        this.pickAccuracyArr,
        this.pickAccXaxisSeries,
        12
      );
    }, 1000 * 2);
  }

  async fetchErrorRateData(
    endpoint: string,
    timeSpan: string,
    startTime: string,
    endTime: string
  ) {
    let { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay();

    // Fetch data from the API
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-tasks`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSpan: timeSpan,
          timeStamp1: timeStamp1,
          timeStamp2: timeStamp2,
        }),
      }
    );

    const data = await response.json();

    // Assuming data contains a list of tasks
    if (data && data.tasks) {
      const totalTasks = data.tasks.length;

      // Count the number of tasks with "FAILED", "CANCELLED", and "REJECTED" statuses
      const failedCount = data.tasks.filter(
        (task: any) => task.TaskStatus_Names === 'FAILED'
      ).length;
      const cancelledCount = data.tasks.filter(
        (task: any) => task.TaskStatus_Names === 'CANCELLED'
      ).length;
      const rejectedCount = data.tasks.filter(
        (task: any) => task.TaskStatus_Names === 'REJECTED'
      ).length;

      // Calculate the error rate
      const errorRate =
        ((totalTasks - (failedCount + cancelledCount + rejectedCount)) /
          totalTasks) *
        100;

      // Return the data with the calculated error rate
      return { tasks: data.tasks, errorRate };
    }

    return { tasks: [], errorRate: 0 };
  }

  async updateErrorRate() {
    this.clearAllIntervals(this.errRateTimeInterval);

    if (this.currentFilter === 'week' || this.currentFilter === 'month') {
      clearInterval(this.errRateTimeInterval);
      this.errRateTimeInterval = 0;

      const data = await this.fetchChartData('err-rate', this.currentFilter);
      if (data.errRate) {
        this.errRateArr = data.errRate.map((stat: any) =>
          Math.round(stat.errorRate)
        );
        this.errRateXaxisSeries = data.errRate.map(
          (stat: any, index: any) => ++index
        );
      }
      this.plotChart(
        'Error rate',
        this.errRateArr,
        this.errRateXaxisSeries,
        30
      );
      return;
    }

    if (this.errRateTimeInterval) return;

    // Fetch the data and calculate the error rate
    const data = await this.fetchChartData('err-rate', this.currentFilter);
    if (data.errRate) {
      this.errRateArr = data.errRate.map((stat: any) =>
        Math.round(stat.errorRate)
      );
      this.errRateXaxisSeries = data.errRate.map(
        (stat: any, index: any) => ++index
      );
    }

    this.plotChart('Error rate', this.errRateArr, this.errRateXaxisSeries);

    this.errRateTimeInterval = setInterval(async () => {
      const data = await this.fetchChartData('err-rate', this.currentFilter);
      if (data.errRate) {
        this.errRateArr = data.errRate.map((stat: any) =>
          Math.round(stat.errorRate)
        );
        this.errRateXaxisSeries = data.errRate.map(
          (stat: any, index: any) => ++index
        );
      }

      this.plotChart('Error rate', this.errRateArr, this.errRateXaxisSeries);
    }, 1000 * 2);
  }

  clearAllIntervals(currInterval: number) {
    if (currInterval !== this.throuputTimeInterval) {
      clearInterval(this.throuputTimeInterval);
      this.throuputTimeInterval = 0;
    }
    if (currInterval !== this.starvationTimeInterval) {
      clearInterval(this.starvationTimeInterval);
      this.starvationTimeInterval = 0;
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

  getTimeStampsOfDay() {
    let currentTime = Math.floor(new Date().getTime() / 1000);
    let startTimeOfDay;
    if (this.currentFilter == 'week') {
      startTimeOfDay = this.weekStartOfDay();
    } else if (this.currentFilter == 'month') {
      startTimeOfDay = this.monthStartOfDay();
    } else {
      startTimeOfDay = this.getStartOfDay();
    }

    return {
      timeStamp1: startTimeOfDay,
      timeStamp2: currentTime,
    };
  }

  getStartOfDay() {
    return Math.floor(new Date().setHours(0, 0, 0) / 1000);
  }

  weekStartOfDay() {
    let currentDate = new Date();

    // Subtract 7 days (last week) from the current date
    let lastWeekDate = new Date();
    lastWeekDate.setDate(currentDate.getDate() - 7);

    return Math.floor(new Date(lastWeekDate).setHours(0, 0, 0) / 1000);
  }

  monthStartOfDay() {
    // Get the current date
    let currentDate = new Date();

    // Subtract 1 month from the current date
    let lastMonthDate = new Date();
    lastMonthDate.setMonth(currentDate.getMonth() - 1);
    return Math.floor(new Date(lastMonthDate).setHours(0, 0, 0) / 1000);
  }

  ngOnDestroy() {
    if (this.throuputTimeInterval) clearInterval(this.throuputTimeInterval);
    if (this.starvationTimeInterval) clearInterval(this.starvationTimeInterval);
    if (this.pickAccTimeInterval) clearInterval(this.pickAccTimeInterval);
    if (this.errRateTimeInterval) clearInterval(this.errRateTimeInterval);

    this.abortControllers.forEach((controller) => controller.abort()); // forEach(val, key, map/arr/..)
    this.abortControllers.clear();
  }

  async getGraphURI(): Promise<any> {
    let base64URI: string = '';
    let result = await this.chartInstance.dataURI(); // resust: { imgURI: string; } | { blob: Blob; }

    base64URI = (result as { imgURI: string }).imgURI;

    return base64URI;
  }

  async fetchWholeGraph() {
    if (this.isFleetUp) await this.exportFileService.fetchWholeGraph();
    await this.generateGraph();
  }

  async generateGraph() {
    this.exportFileService.URIStrings[0] = await this.updateChartInstance(
      this.exportFileService.throughputArr,
      this.exportFileService.throughputXaxisSeries
    );
    this.exportFileService.URIStrings[1] = await this.updateChartInstance(
      this.exportFileService.starvationArr,
      this.exportFileService.starvationXaxisSeries
    );
    this.exportFileService.URIStrings[2] = await this.updateChartInstance(
      this.exportFileService.pickAccuracyArr,
      this.exportFileService.pickAccXaxisSeries
    );
    this.exportFileService.URIStrings[3] = await this.updateChartInstance(
      this.exportFileService.errRateArr,
      this.exportFileService.errRateXaxisSeries
    );
  }

  async updateChartInstance(
    graphArr: number[],
    XaxisSeries: string[],
    limit: number = 5
  ): Promise<any> {
    const limitedData = graphArr.length > limit ? graphArr.slice(-limit) : graphArr;
    const limitedTime = XaxisSeries.length > limit ? XaxisSeries.slice(-limit) : XaxisSeries;
    this.chartInstance.updateOptions({
      series: [{ name: 'taskGraph', data: limitedData }],
      xaxis: { categories: limitedTime },
    });

    return await this.getGraphURI();
  }
}
