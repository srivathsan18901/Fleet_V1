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
  ApexAnnotations,
  ApexGrid,
  ApexStroke,
  ChartComponent,
  ApexMarkers,
} from 'ng-apexcharts';
import { environment } from '../../environments/environment.development';
import { ProjectService } from '../services/project.service';
import { TranslationService } from '../services/translation.service';
import { ExportFileService } from '../services/export-file.service';
import { IsFleetService } from '../services/shared/is-fleet.service';
import { Subscription } from 'rxjs';

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
  markers: ApexMarkers;
};

interface Robo {
  roboName: string;
  roboId: number;
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
  isFleetMode: boolean = false;

  private subscriptions: Subscription[] = [];

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
  mapRobos: any = { roboPos: [], simMode: [] };

  constructor(
    private projectService: ProjectService,
    private cdRef: ChangeDetectorRef,
    private translationService: TranslationService,
    private exportFileService: ExportFileService,
    private isFleetService: IsFleetService
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
        categories: [],
        type: 'datetime', // Important: Uses timestamps directly
        tickAmount: 6,
        labels: {
          format: 'dd MMM HH:mm', // Ensures date + time format
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
              color: '#8DD98B',
              opacity: 0.5,
            },
            {
              offset: 100,
              color: '#8DD98B',
              opacity: 0.1,
            },
          ],
        },
      },
      dataLabels: {
        enabled: false,
      },
      markers: {
        size: 0, // Controls the size of the point
        colors: ['#8DD98B'], // Sets the point color
        strokeColors: '#8DD98B', // Sets the border color
        strokeWidth: 2, // Adjusts the border thickness
        hover: {
          size: 4, // Slightly enlarges the point on hover
        },
      },
      stroke: {
        curve: 'smooth',
        width: 3,
        colors: ['#8DD98B'], // This is the key change: making sure the stroke is red
      },
      tooltip: {
        enabled: true,
        theme: 'dark',
        x: {
          format: 'dd MMM',
        },
        marker: {
          fillColors: ['#DD7373'], // Changes the tooltip marker color
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

  async ngOnInit(): Promise<void> {
    this.selectedMap = this.projectService.getMapData();

    this.mapRobos = await this.getRobos();
    // this.getLiveRoboInfo().then((names) => {
    //   this.roboNames = names;
    // });

    this.roboNames = this.swapRobos();

    const isFleetUp = this.projectService.isFleetUp$.subscribe((status) => {
      this.isFleetUp = status;
    });

    const isFleet = this.isFleetService.isFleet$.subscribe((status) => {
      this.isFleetMode = status;
      this.roboNames = this.swapRobos();
    });

    this.subscriptions.push(isFleetUp, isFleet);

    this.updateChart('data1', 'Throughput');
  }

  // async getLiveRoboInfo(): Promise<string[]> {
  //   if (!this.selectedMap) return [];
  //   try {
  //     const response = await fetch(
  //       `http://${environment.API_URL}:${environment.PORT}/robo-configuration/get-robos/${this.selectedMap.id}`,
  //       {
  //         method: 'GET',
  //         credentials: 'include',
  //       }
  //     );

  //     const data = await response.json();

  //     if (!data.populatedRobos || data.msg !== 'data sent!') {
  //       // console.log(data);
  //       console.error('Invalid API response');
  //       return [];
  //     }
  //     return data.populatedRobos.map((robo: any) => {
  //       return {
  //         roboName: robo.roboName || 'Unknown Robo',
  //         roboId: robo.amrId,
  //       };
  //     });
  //   } catch (error) {
  //     console.error('Error fetching robot names:', error);
  //     return [];
  //   }
  // }

  swapRobos() {
    if (!this.selectedMap) return;
    if (this.isFleetMode) {
      return this.mapRobos.roboPos?.map((robo: any) => {
        return {
          roboName: robo.roboDet.roboName || 'Unknown Robo',
          roboId: robo.roboDet.id,
        };
      });
    }

    return this.mapRobos.simMode?.map((robo: any) => {
      return {
        roboName: robo.roboName || 'Unknown Robo',
        roboId: robo.amrId,
      };
    });
  }

  roboNames: any[] = [];
  selectedType: string = 'Overall'; // Default selection for the dropdown
  selectedRoboId: Robo | null = null;

  updateSelection(type: string, robo: any): void {
    this.selectedType = type;
    this.selectedRoboId = robo ? robo.roboId : robo;
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

  chunkDataArr(data: any[], time: any[], limit: number): any[][] {
    let chunks = [];
    let timeChunks = [];
    let resultedData: number[] = [];
    let resultedTime: any[] = [];
    let arrayLimit = data.length / limit;
    for (let i = limit; i > 0; i--) {
      let chunk = data.splice(0, arrayLimit);
      let timeChunk = time.splice(0, arrayLimit);
      chunks.push(chunk);
      timeChunks.push(timeChunk);
    }
    for (let i = 0; i < chunks.length; i++) {
      let sum = 0;
      chunks[i].forEach((val) => {
        sum += val;
      });
      let avg = Math.round(sum / chunks[i].length);
      resultedData.push(avg);
      let timeChunklen = timeChunks[i].length - 1;
      resultedTime.push(timeChunks[i][timeChunklen]);
    }

    return [resultedData, resultedTime];
  }

  plotChart(seriesName: string, data: any[], time: any[], limit: number = 7) {
    // let [limitedData, limitedTime] = this.isFleetUp
    //   ? this.chunkDataArr(data, time, limit)
    //   : [[0], ['']];

    // if (this.isFleetUp)
    //   limitedTime = limitedTime.map((time: String) => time.split(','));

    this.chart.updateOptions(
      {
        series: [{ name: seriesName, data: data }],
        xaxis: { categories: time },
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
            roboId: this.selectedRoboId,
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

  // < ---------- >

  async updateThroughput() {
    this.clearAllIntervals(this.throuputTimeInterval);
    if (this.currentFilter === 'week' || this.currentFilter === 'month') {
      clearInterval(this.throuputTimeInterval);
      this.throuputTimeInterval = 0;
      const data = await this.fetchChartData('throughput', this.currentFilter);
      // console.log(data);
      if (data.throughput) {
        this.throughputArr = data.throughput.Stat.map(
          (stat: any) => stat.TotalThroughPutPerHour
        );
        this.throughputXaxisSeries = data.throughput.Stat.map((stat: any) =>
          new Date(stat.TimeStamp * 1000).toLocaleString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          })
        );
      }

      this.plotChart(
        'Throughput',
        this.throughputArr,
        this.throughputXaxisSeries,
        7
      );
      return;
    }

    if (this.throuputTimeInterval) return;

    const data = await this.fetchChartData('throughput', this.currentFilter);
    if (data && !data.throughput) return;
    let { Stat } = data.throughput;

    if (data.throughput) {
      this.throughputArr = Stat.map((stat: any) => stat.TotalThroughPutPerHour);
      this.throughputXaxisSeries = Stat.map((stat: any) =>
        new Date(stat.TimeStamp * 1000).toLocaleString('en-IN', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        })
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
        this.throughputXaxisSeries = Stat.map((stat: any) =>
          new Date(stat.TimeStamp * 1000).toLocaleString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          })
        );
        this.systemThroughputEvent.emit(this.throughputArr);
      }

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
      // console.log(data, 'data starvation');

      if (data.starvation) {
        this.starvationArr = data.starvation.map((stat: any) => {
          return Math.round(stat.starvationRate);
        });
        this.starvationXaxisSeries = data.starvation.map((stat: any) =>
          new Date(stat.TimeStamp * 1000).toLocaleString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          })
        );
      }
      this.plotChart(
        'Starvation rate',
        this.starvationArr,
        this.starvationXaxisSeries,
        7
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
      this.starvationXaxisSeries = data.starvation.map((stat: any) =>
        new Date(stat.TimeStamp * 1000).toLocaleString('en-IN', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        })
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
        this.starvationXaxisSeries = data.starvation.map((stat: any) =>
          new Date(stat.TimeStamp * 1000).toLocaleString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          })
        );
      }
      this.plotChart(
        'Starvation rate',
        this.starvationArr,
        this.starvationXaxisSeries
      );
    }, 1000 * 2);
  }

  async updatePickAccuracy() {
    let startTime = new Date().setHours(0, 0, 0, 0); // Set current time to starting time of the current day..
    let endTime = new Date().setMilliseconds(0); // Time in milliseconds..

    this.clearAllIntervals(this.pickAccTimeInterval);

    if (this.currentFilter === 'week' || this.currentFilter === 'month') {
      clearInterval(this.pickAccTimeInterval);
      this.pickAccTimeInterval = 0;
      const data = await this.fetchChartData(
        'pickaccuracy',
        this.currentFilter
      );

      if (data.throughput) {
        this.pickAccuracyArr = data.throughput.Stat.map((stat: any) =>
          Math.round(stat.pickAccuracy)
        );
        this.pickAccXaxisSeries = data.throughput.Stat.map((stat: any) =>
          new Date(stat.TimeStamp * 1000).toLocaleString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          })
        );
      }

      this.plotChart(
        'Pick accuracy',
        this.pickAccuracyArr,
        this.pickAccXaxisSeries,
        7
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
      this.pickAccXaxisSeries = data.throughput.Stat.map((stat: any) =>
        new Date(stat.TimeStamp * 1000).toLocaleString('en-IN', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        })
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

      if (data.throughput) {
        this.pickAccuracyArr = data.throughput.Stat.map((stat: any) =>
          Math.round(stat.pickAccuracy)
        );
        this.pickAccXaxisSeries = data.throughput.Stat.map(
          (stat: any) => stat.TimeStamp
          // new Date(stat.TimeStamp * 1000).toLocaleString('en-IN', {
          //   month: 'short',
          //   day: 'numeric',
          //   hour: 'numeric',
          //   minute: 'numeric',
          // })
        );
      }

      this.plotChart(
        'Pick accuracy',
        this.pickAccuracyArr,
        this.pickAccXaxisSeries
      );
    }, 1000 * 2);
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
          (stat: any) => stat.TimeStamp
          // new Date(stat.TimeStamp * 1000).toLocaleString('en-IN', {
          //   month: 'short',
          //   day: 'numeric',
          //   hour: 'numeric',
          //   minute: 'numeric',
          // })
        );
      }
      this.plotChart('Error rate', this.errRateArr, this.errRateXaxisSeries, 7);
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
        (stat: any) => stat.TimeStamp
        // new Date(stat.TimeStamp * 1000).toLocaleString('en-IN', {
        //   month: 'short',
        //   day: 'numeric',
        //   hour: 'numeric',
        //   minute: 'numeric',
        // })
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
          (stat: any) => stat.TimeStamp
          // new Date(stat.TimeStamp * 1000).toLocaleString('en-IN', {
          //   month: 'short',
          //   day: 'numeric',
          //   hour: 'numeric',
          //   minute: 'numeric',
          // })
        );
      }

      this.plotChart('Error rate', this.errRateArr, this.errRateXaxisSeries);
    }, 1000 * 2);
  }

  // < ---------- >

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

  async getGraphURI(): Promise<any> {
    let base64URI: string = '';
    let result = await this.chartInstance.dataURI(); // resust: { imgURI: string; } | { blob: Blob; }

    base64URI = (result as { imgURI: string }).imgURI;

    return base64URI;
  }

  async fetchWholeGraph() {
    this.chartInstance.updateOptions({
      animations: {
        enabled: false,
      },
      xaxis: {
        labels: {
          style: {
            colors: '#000000',
            fontSize: '7px',
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: '#000000',
            fontSize: '7px',
          },
        },
      },
    });
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
    limit: number = 7
  ): Promise<any> {
    let [limitedData, limitedTime] = this.chunkDataArr(
      graphArr,
      XaxisSeries,
      limit
    );
    if (this.isFleetUp)
      limitedTime = limitedTime.map((time: String) => time.split(','));

    if (!this.isFleetUp) {
      limitedData = [0];
      limitedTime = [''];
    }

    this.chartInstance.updateOptions(
      {
        series: [{ name: 'taskGraph', data: limitedData }],
        xaxis: { categories: limitedTime },
      },
      false,
      false
    );

    return await this.getGraphURI();
  }

  async getRobos(): Promise<any> {
    try {
      // this.selectedMap.id
      const response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${this.selectedMap.mapName}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      let data = await response.json();
      if (data.error || !data || !data.map) return [];
      const { roboPos, simMode } = data.map;
      return { roboPos, simMode };
    } catch (error) {
      return null;
    }
  }

  ngOnDestroy() {
    if (this.throuputTimeInterval) clearInterval(this.throuputTimeInterval);
    if (this.starvationTimeInterval) clearInterval(this.starvationTimeInterval);
    if (this.pickAccTimeInterval) clearInterval(this.pickAccTimeInterval);
    if (this.errRateTimeInterval) clearInterval(this.errRateTimeInterval);

    this.abortControllers.forEach((controller) => controller.abort()); // forEach(val, key, map/arr/..)
    this.abortControllers.clear();
  }
}
