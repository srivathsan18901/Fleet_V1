import {
  ChangeDetectorRef,
  Component,
  Inject,
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
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  Robot,
  RobotDetailPopupComponent,
} from '../robot-detail-popup/robot-detail-popup.component';

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
  selectedType: string = 'Overall'; // Default selection for the dropdown
  roboNames: string[] = [];
  // selectedMetric: string = 'CPU Utilization';
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
  selectedMetric: string = ''; // Initialize with an empty string or a default value

  metrics = {
    Overall: [
      { key: 'data1', label: 'CPU Utilization' },
      { key: 'data2', label: 'Robot Utilization' },
      { key: 'data3', label: 'Memory' },
      { key: 'data4', label: 'Network' },
      { key: 'data5', label: 'Idle Time' },
      { key: 'data6', label: 'Error' },
      { key: 'data7', label: 'Battery' },
    ],
    robot: [
      { key: 'data1', label: 'CPU Utilization' },
      { key: 'data2', label: 'Robot Utilization' },
      { key: 'data3', label: 'Memory' },
      { key: 'data4', label: 'Network' },
      { key: 'data5', label: 'Error' },
      { key: 'data6', label: 'Idle Time' },
      { key: 'data7', label: 'Battery' },
    ],
  };

  constructor(
    private projectService: ProjectService,
    private cdRef: ChangeDetectorRef
  ) {
    this.getLiveRoboInfo().then((names) => {
      this.roboNames = names;
    });
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
    this.currentFilter = 'today';
    this.selectedMap = this.projectService.getMapData();
    if (!this.selectedMap) {
      this.selectedMap = 'N/A';
      return;
    }
    this.getLiveRoboInfo().then((names) => {
      this.roboNames = names;
    });
    this.currentFilter = 'today';
    this.updateChart('data1', 'CPU Utilization');
    this.getLiveRoboInfo();
    console.log(this.getLiveRoboInfo);
  }

  // Fetch Robo Names from API
  async getLiveRoboInfo(): Promise<string[]> {
    try {
      const response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/robo-configuration/get-robos/${this.selectedMap.id}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );
      console.log(response);

      const data = await response.json();
      console.log(data);
      if (!data.populatedRobos || data.msg !== 'data sent!') {
        console.log(data);
        console.error('Invalid API response');
        return [];
      }
      return data.populatedRobos.map(
        (robo: any) => robo.roboName || 'Unknown Robo'
      );
    } catch (error) {
      console.error('Error fetching robot names:', error);
      return [];
    }
  }

  // Update the selected type
  updateSelection(type: string): void {
    this.selectedType = type;
    // this.getTimeStampsOfDay()
  }
  // Get metrics based on the selected type
  getMetrics(type: string): any[] {
    return type === 'Overall' ? this.metrics.Overall : this.metrics.robot;
  }

  // Method to update scope and metrics
  // updateScope(scope: string): void {
  //   this.selectedScope = scope;
  //   // console.log(this.data)
  //   // Update metric options based on scope
  //   if (scope === 'Overall') {
  //     this.metricOptions = this.overallMetrics;
  //   } else if (scope === 'Robot') {
  //     this.metricOptions = this.robotMetrics;
  //   }

  //   // Reset the selected metric
  //   const defaultOption = this.metricOptions[0];
  //   this.selectedMetric = defaultOption ? defaultOption.name : '';
  // }

  // updateChart(dataKey: string, metricName: string): void {
  //   if (!this.selectedMap) {
  //     console.log('no map has been selected!');
  //     return;
  //   }
  //   this.selectedMetric = metricName; // Update the displayed metric name

  //   switch (dataKey) {
  //     case 'data1':
  //       this.updateCpuUtil();
  //       break;
  //     case 'data2':
  //       this.updateRoboUtil();
  //       break;
  //     case 'data3':
  //       this.updateBattery();
  //       break;
  //     case 'data4':
  //       this.updateMemory();
  //       break;
  //     case 'data5':
  //       this.updateNetwork();
  //       break;
  //     case 'data6':
  //       this.updateIdleTime();
  //       break;
  //     case 'data7':
  //       this.updateErr();
  //       break;
  //   }
  // }

  // applyFilter(event: any) {
  //   this.currentFilter = event.target.value.toLowerCase();

  //   // this.intervals.forEach((interval) => {
  //   //   if (this[interval]) {
  //   if (this.selectedMetric === 'CPU Utilization')
  //     this.updateChart('data1', this.selectedMetric);
  //   else if (this.selectedMetric === 'Robot Utilization')
  //     this.updateChart('data2', this.selectedMetric);
  //   else if (this.selectedMetric === 'Battery')
  //     this.updateChart('data3', this.selectedMetric);
  //   else if (this.selectedMetric === 'Memory')
  //     this.updateChart('data4', this.selectedMetric);
  //   else if (this.selectedMetric === 'Network')
  //     this.updateChart('data5', this.selectedMetric);
  //   else if (this.selectedMetric === 'Idle Time')
  //     this.updateChart('data6', this.selectedMetric);
  //   else this.updateChart('data7', this.selectedMetric);
  //   // return;
  //   // }
  //   // });
  // }

  updateChart(dataKey: string, metricName: string): void {
    if (!this.selectedMap) {
      console.log('No map has been selected!');
      return;
    }

    this.selectedMetric = metricName; // Update the displayed metric name

    const updateFunctions: { [key: string]: () => void } = {
      data1: this.updateCpuUtil.bind(this),
      data2: this.updateRoboUtil.bind(this),
      data7: this.updateBattery.bind(this),
      data3: this.updateMemory.bind(this),
      data4: this.updateNetwork.bind(this),
      data5: this.updateIdleTime.bind(this),
      data6: this.updateErr.bind(this),
    };

    const updateFunction = updateFunctions[dataKey];
    if (updateFunction) {
      updateFunction();
    } else {
      console.log(`No update function found for dataKey: ${dataKey}`);
    }
  }

  applyFilter(event: any): void {
    this.currentFilter = event.target.value.toLowerCase();
    console.log(this.currentFilter, 'current filter'); // console.log(this.currentFilter)
    const metricToDataKey: { [key: string]: string } = {
      'CPU Utilization': 'data1',
      'Robot Utilization': 'data2',
      Memory: 'data3',
      // 'Battery': 'data7',
      Network: 'data4',
      // 'Memory': 'data3',
      // 'Network': 'data4',
      'Idle Time': 'data5',
      Error: 'data6',
      Battery: 'data7',
    };

    const dataKey = metricToDataKey[this.selectedMetric];
    if (dataKey) {
      this.updateChart(dataKey, this.selectedMetric);
    } else {
      console.log(
        `No dataKey found for selectedMetric: ${this.selectedMetric}`
      );
    }
  }

  plotChart(seriesName: string, data: any[], time: any[], limit: number = 12) {
    const limitedData = data.length > limit ? data.slice(-limit) : data;
    const limitedTime = time.length > limit ? time.slice(-limit) : time;

    // this.chartOptions.series = [{ name: seriesName, data: limitedData }];
    // console.log("plot chart fn",seriesName,"--",data,"---",time,"--",limit)
    this.chart.updateOptions(
      {
        series: [{ name: seriesName, data: limitedData }],
        xaxis: { categories: limitedTime },
      },
      false, // Don't replot the entire chart
      true // Smooth transitions
    );
  }

  async fetchChartData(
    endpoint: string,
    timeSpan: string,
    startTime: string,
    endTime: string
  ) {
    let { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay();
    // console.log(this.selectedType, '++++++++++++++++++++++');
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/graph/${endpoint}/${this.selectedMap.id}`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: this.selectedType,
          timeSpan: timeSpan, // e.g. 'Daily' or 'Weekly'
          timeStamp1: timeStamp1,
          timeStamp2: timeStamp2,
        }),
      }
    );
    // console.log(response);
    return await response.json();
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

  async updateCpuUtil() {
    // this.chartOptions.xaxis.range = 12; // get use of it..
    // console.log(this.cpuUtilTimeInterval,"interval")
    this.clearAllIntervals(this.cpuUtilTimeInterval); //argu is null
    // console.log(this.currentFilter,"current filter") // current val is null
    if (this.currentFilter === 'week' || this.currentFilter === 'month') {
      clearInterval(this.cpuUtilTimeInterval);
      this.cpuUtilTimeInterval = 0;
      const data = await this.fetchChartData(
        'cpu-utilization',
        this.currentFilter,
        '',
        ''
      );
      // console.log(data, 'data-cpu util');
      if (data.cpuUtil) {
        this.cpuUtilArr = data.cpuUtil.CPU_Utilization.map((stat: any) => {
          let res;
          // console.log(stat, 'stat');
          for (let key in stat) {
            res = stat[key];
            // console.log(key,"-----------------")
          }
          // console.log(res, 'res');
          return res;
        });
        this.cpuXaxisSeries = data.cpuUtil.CPU_Utilization.map(
          (stat: any, index: any) => (index += 1)
        );
      }
      let mapArr = (stat: any) => {};
      // console.log(this.cpuUtilArr, '<----cpu');
      // console.log(this.cpuXaxisSeries, 'x axis');
      this.plotChart(
        'CPU Utilization',
        this.cpuUtilArr,
        this.cpuXaxisSeries,
        30
      );
      return;
    }

    if (this.cpuUtilTimeInterval) return;

    const data = await this.fetchChartData(
      'cpu-utilization',
      this.currentFilter,
      '',
      ''
    );
    // console.log(data,"data") //hold the chart data
    if (data.cpuUtil) {
      this.cpuUtilArr = data.cpuUtil.CPU_Utilization.map((stat: any) => {
        let res;
        // console.log(stat, 'stat');
        for (let key in stat) {
          res = stat[key];
          // console.log(key,"-----------------")
        }
        // console.log(res, 'res');
        return res;
      });
      this.cpuXaxisSeries = data.cpuUtil.CPU_Utilization.map(
        (stat: any) => stat.time
      );
    }
    // console.log("throughPut 2")
    this.plotChart('CPU Utilization', this.cpuUtilArr, this.cpuXaxisSeries);

    this.cpuUtilTimeInterval = setInterval(async () => {
      const data = await this.fetchChartData(
        'cpu-utilization',
        this.currentFilter,
        '',
        ''
      );
      if (data.cpuUtil) {
        this.cpuUtilArr = data.cpuUtil.CPU_Utilization.map((stat: any) => {
          let res;
          for (let key in stat) {
            res = stat[key];
            // console.log(key, '-----------------');
          }
          return res;
        });
        this.cpuXaxisSeries = data.cpuUtil.CPU_Utilization.map(
          (stat: any, index: any) => (index += 1)
        );
      }
      // console.log("throughPut 3")
      this.plotChart('CPU Utilization', this.cpuUtilArr, this.cpuXaxisSeries);
    }, 1000 * 2);
  }

  async updateRoboUtil() {
    // this.chartOptions.xaxis.range = 12; // get use of it..
    this.clearAllIntervals(this.roboUtilTimeInterval);
    if (this.currentFilter === 'week' || this.currentFilter === 'month') {
      clearInterval(this.roboUtilTimeInterval);
      this.roboUtilTimeInterval = 0;
      const data = await this.fetchChartData(
        'robo-utilization',
        this.currentFilter,
        '',
        ''
      );
      // console.log(data,'------------------------');
      if (data.roboUtil) {
        this.roboUtilArr = data.roboUtil.Robot_Utilization.map((stat: any) => {
          let res;
          for (let key in stat) {
            res = stat[key];
            // console.log(key, '-----------------');
          }
          return res;
        });
        // console.log(data.roboUtil,'-------------------')
        this.roboXaxisSeries = data.roboUtil.Robot_Utilization.map(
          (stat: any, index: any) => (index += 1)
        );
      }
      this.plotChart(
        'Robot Utilization',
        this.roboUtilArr,
        this.roboXaxisSeries,
        30
      );
      return;
    }

    if (this.roboUtilTimeInterval) return;

    const data = await this.fetchChartData(
      'robo-utilization',
      this.currentFilter,
      '',
      ''
    );
    console.log(data,'data robot util')
    if (data.roboUtil) {
      this.roboUtilArr = data.roboUtil.Robot_Utilization
      .map(
        (stat: any) =>{
          let res;
          for (let key in stat) {
            res = stat[key];
            // console.log(key, '-----------------');
          }
          return res;
        });
      this.roboXaxisSeries = data.roboUtil.Robot_Utilization.map(
        (stat: any, index: any) => (index += 1)
      );
    }
    this.plotChart('Robot Utilization', this.roboUtilArr, this.roboXaxisSeries);

    this.roboUtilTimeInterval = setInterval(async () => {
      const data = await this.fetchChartData(
        'robo-utilization',
        this.currentFilter,
        '',
        ''
      );
      if (data.roboUtil) {
        this.roboUtilArr = data.roboUtil.Robot_Utilization.map((stat: any) => {
          let res;
          for (let key in stat) {
            res = stat[key];
            // console.log(key, '-----------------');
          }
          return res;
        });
        this.roboXaxisSeries = data.roboUtil.Robot_Utilization.map(
          (stat: any, index: any) => (index += 1)
        );
      }
      this.plotChart(
        'Robot Utilization',
        this.roboUtilArr,
        this.roboXaxisSeries
      );
    }, 1000 * 2);
  }

  async updateBattery() {
    this.clearAllIntervals(this.batteryTimeInterval);
    if (this.currentFilter === 'week' || this.currentFilter === 'month') {
      clearInterval(this.batteryTimeInterval);
      this.batteryTimeInterval = 0;
      const data = await this.fetchChartData(
        'battery',
        this.currentFilter,
        '',
        ''
      );
      // console.log(data,"========")
      if (data.batteryStat) {
        this.batteryArr = data.batteryStat.batteryPercentage.map((stat: any) => {
          let res;
          for (let key in stat) {
            res = stat[key];
            // console.log(key, '-----------------');
          }
          return res;
        });
        this.batteryXaxisSeries = data.batteryStat.batteryPercentage.map(
          (stat: any, index: any) => (index += 1)
        );
      }
      this.plotChart('Battery', this.batteryArr, this.batteryXaxisSeries, 30);
      return;
    }

    if (this.batteryTimeInterval) return;

    const data = await this.fetchChartData(
      'battery',
      this.currentFilter,
      '',
      ''
    );
    // console.log(data,'========battery====')
    if (data.batteryStat) {
      this.batteryArr = data.batteryStat.batteryPercentage.map((stat: any) => {
        let res;
        for (let key in stat) {
          res = stat[key];
          // console.log(key, '-----------------');
        }
        return res;
      });
      this.batteryXaxisSeries = data.batteryStat.batteryPercentage.map(
        (stat: any, index: any) => (index += 1)
      );
    }
    this.plotChart('Battery', this.batteryArr, this.batteryXaxisSeries);

    this.batteryTimeInterval = setInterval(async () => {
      const data = await this.fetchChartData(
        'battery',
        this.currentFilter,
        '',
        ''
      );
      if (data.batteryStat) {
        this.batteryArr = data.batteryStat.batteryPercentage.map((stat: any) => {
          let res;
          for (let key in stat) {
            res = stat[key];
            // console.log(key, '-----------------');
          }
          return res;
        });
        this.batteryXaxisSeries = data.batteryStat.batteryPercentage.map(
          (stat: any, index: any) => (index += 1)
        );
      }
      this.plotChart('Battery', this.batteryArr, this.batteryXaxisSeries);
    }, 1000 * 2);
  }

  async updateMemory() {
    this.clearAllIntervals(this.memoryTimeInterval);
    if (this.currentFilter === 'week' || this.currentFilter === 'month') {
      clearInterval(this.memoryTimeInterval);
      this.memoryTimeInterval = 0;
      const data = await this.fetchChartData(
        'memory',
        this.currentFilter,
        '',
        ''
      );
      // console.log(data,'======memory====')
      if (data.memoryStat) {
        this.memoryArr = data.memoryStat.Memory.map((stat: any) => {
          let res;
          for (let key in stat) {
            res = stat[key];
            // console.log(key, '-----------------');
          }
          return res;
        });
        this.memoryXaxisSeries = data.memoryStat.Memory.map(
          (stat: any, index: any) => (index += 1)
        );
      }
      this.plotChart('Memory', this.memoryArr, this.memoryXaxisSeries, 30);
      return;
    }

    if (this.memoryTimeInterval) return;

    const data = await this.fetchChartData(
      'memory',
      this.currentFilter,
      '',
      ''
    );
    // console.log(data,'=======memory=======')
    if (data.memoryStat) {
      this.memoryArr = data.memoryStat.Memory.map((stat: any) => {
        let res;
        for (let key in stat) {
          res = stat[key];
          // console.log(key, '-----------------');
        }
        return res;
      });
      this.memoryXaxisSeries = data.memoryStat.Memory.map(
        (stat: any, index: any) => (index += 1)
      );
    }
    this.plotChart('Memory', this.memoryArr, this.memoryXaxisSeries);

    this.memoryTimeInterval = setInterval(async () => {
      const data = await this.fetchChartData(
        'memory',
        this.currentFilter,
        '',
        ''
      );
      if (data.memoryStat) {
        this.memoryArr = data.memoryStat.Memory.map((stat: any) => {
          let res;
          for (let key in stat) {
            res = stat[key];
            // console.log(key, '-----------------');
          }
          return res;
        });
        this.memoryXaxisSeries = data.memoryStat.Memory.map(
          (stat: any, index: any) => (index += 1)
        );
      }
      this.plotChart('Memory', this.memoryArr, this.memoryXaxisSeries);
    }, 1000 * 2);
  }

  async updateNetwork() {
    this.clearAllIntervals(this.networkTimeInterval);
    if (this.currentFilter === 'week' || this.currentFilter === 'month') {
      clearInterval(this.networkTimeInterval);
      this.networkTimeInterval = 0;
      const data = await this.fetchChartData(
        'network',
        this.currentFilter,
        '',
        ''
      );
      // console.log(data,"======network=====")
      if (data.networkUtil) {
        this.networkArr = data.networkUtil.Network.map((stat: any) => {
          let res;
          for (let key in stat) {
            res = stat[key];
            // console.log(key, '-----------------');
          }
          return res;
        });
        this.networkXaxisSeries = data.networkUtil.Network.map(
          (stat: any, index: any) => (index += 1)
        );
      }
      this.plotChart('Network', this.networkArr, this.networkXaxisSeries, 30);
      return;
    }

    if (this.networkTimeInterval) return;

    const data = await this.fetchChartData(
      'network',
      this.currentFilter,
      '',
      ''
    );
    console.log(data,'=======network=====')//
    if (data.networkUtil) {
      this.networkArr = data.networkUtil.Network.map((stat: any) => {
        let res;
        for (let key in stat) {
          res = stat[key];
          // console.log(key, '-----------------');
        }
        return res;
      });
      this.networkXaxisSeries = data.networkUtil.Network.map(
        (stat: any, index: any) => (index += 1)
      );
    }
    this.plotChart('Network', this.networkArr, this.networkXaxisSeries);
    this.networkTimeInterval = setInterval(async () => {
      const data = await this.fetchChartData(
        'network',
        this.currentFilter,
        '',
        ''
      );
      if (data.networkUtil) {
        this.networkArr = data.networkUtil.Network.map((stat: any) => {
          let res;
          for (let key in stat) {
            res = stat[key];
            // console.log(key, '-----------------');
          }
          return res;
        });
        this.networkXaxisSeries = data.networkUtil.Network.map(
          (stat: any, index: any) => (index += 1)
        );
      }
      this.plotChart('Network', this.networkArr, this.networkXaxisSeries);
    }, 1000 * 2);
  }

  async updateIdleTime() {
    this.clearAllIntervals(this.idleTimeInterval);
    if (this.currentFilter === 'week' || this.currentFilter === 'month') {
      clearInterval(this.idleTimeInterval);
      this.idleTimeInterval = 0;
      const data = await this.fetchChartData(
        'idle-time',
        this.currentFilter,
        '',
        ''
      );
      // console.log(data,'=====idle====')
      if (data.idleTime) {
        this.idleTimeArr = data.idleTime.map((stat: any) => {
          let res;
          for (let key in stat) {
            res = stat[key];
            // console.log(key, '-----------------');
          }
          return res;
        });
        this.idleTimeXaxisSeries = data.idleTime.map(
          (stat: any, index: any) => (index += 1)
        );
      }
      this.plotChart(
        'Idle Time',
        this.idleTimeArr,
        this.idleTimeXaxisSeries,
        30
      );
      return;
    }

    if (this.idleTimeInterval) return;

    const data = await this.fetchChartData(
      'idle-time',
      this.currentFilter,
      '',
      ''
    );
    // console.log(data,'=====idle====')
    if (data.idleTime) {
      this.idleTimeArr = data.idleTime.map((stat: any) => {
        let res;
        for (let key in stat) {
          res = stat[key];
          // console.log(key, '-----------------');
        }
        return res;
      });
      this.idleTimeXaxisSeries = data.idleTime.map(
        (stat: any, index: any) => (index += 1)
      );
    }
    this.plotChart('Idle Time', this.idleTimeArr, this.idleTimeXaxisSeries);

    this.idleTimeInterval = setInterval(async () => {
      const data = await this.fetchChartData(
        'idle-time',
        this.currentFilter,
        '',
        ''
      );
      if (data.idleTime) {
        this.idleTimeArr = data.idleTime.map((stat: any) => {
          let res;
          for (let key in stat) {
            res = stat[key];
            // console.log(key, '-----------------');
          }
          return res;
        });
        this.idleTimeXaxisSeries = data.idleTime.map(
          (stat: any, index: any) => (index += 1)
        );
      }
      this.plotChart('Idle Time', this.idleTimeArr, this.idleTimeXaxisSeries);
    }, 1000 * 2);
  }

  async updateErr() {
    this.clearAllIntervals(this.errTimeInterval);
    if (this.currentFilter === 'week' || this.currentFilter === 'month') {
      clearInterval(this.errTimeInterval);
      this.errTimeInterval = 0;
      const data = await this.fetchChartData(
        'robo-err',
        this.currentFilter,
        '',
        ''
      );
      console.log(data,'=====error====')
      if (data.roboErr) {
        this.errorArr = data.roboErr.map((stat: any) => {
          let res;
          for (let key in stat) {
            res = stat[key];
          }
          return res;
        });
        this.errRateXaxisSeries = data.roboErr.map(
          (stat: any, index: any) => (index += 1)
        );
      }
      // console.log(this.errorArr, 'error arr');
      this.plotChart('Error', this.errorArr, this.errRateXaxisSeries, 30);
      return;
    }

    if (this.errTimeInterval) return;

    const data = await this.fetchChartData(
      'robo-err',
      this.currentFilter,
      '',
      ''
    );
    // console.log(data,'=====error====')
    if (data.roboErr) {
      this.errorArr = data.roboErr.map((stat: any) => {
        let res;
        for (let key in stat) {
          res = stat[key];
          // console.log(key, '-----------------');
        }
        return res;
      });
      this.errRateXaxisSeries = data.roboErr.map(
        (stat: any, index: any) => (index += 1)
      );
    }
    this.plotChart('Error', this.errorArr, this.errRateXaxisSeries);

    this.errTimeInterval = setInterval(async () => {
      const data = await this.fetchChartData(
        'robo-err',
        this.currentFilter,
        '',
        ''
      );
      if (data.roboErr) {
        this.errorArr = data.roboErr.map((stat: any) => {
          let res;
          for (let key in stat) {
            res = stat[key];
            // console.log(key, '-----------------');
          }
          return res;
        });
        this.errRateXaxisSeries = data.roboErr.map(
          (stat: any, index: any) => (index += 1)
        );
      }
      this.plotChart('Error', this.errorArr, this.errRateXaxisSeries);
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
