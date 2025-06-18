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
  ApexGrid,
} from 'ng-apexcharts';
import { ProjectService } from '../services/project.service';
import { environment } from '../../environments/environment.development';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslationService } from '../services/translation.service';
import { map, Subscription } from 'rxjs';
import { IsFleetService } from '../services/shared/is-fleet.service';
import e from 'express';
import * as XLSX from 'xlsx';
interface Robo {
  roboName: string;
  roboId: number;
}

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
  roboNames: any[] = [];
  // selectedMetric: string = 'CPU Utilization';
  selectedMap: any | null = null;
  currentFilter: any | null = null;
  selectedRobo: Robo | null = null;
  private langSubscription!: Subscription;
  // Updated data sets..
  cpuUtilArr: number[] = [0];
  cpuXaxisSeries: Date[] = [new Date()];

  roboUtilArr: number[] = [0];
  roboXaxisSeries: Date[] = [new Date()];

  batteryArr: number[] = [0];
  batteryXaxisSeries: Date[] = [new Date()];

  memoryArr: number[] = [0];
  memoryXaxisSeries: Date[] = [new Date()];

  networkArr: number[] = [0];
  networkXaxisSeries: Date[] = [new Date()];

  idleTimeArr: number[] = [0];
  idleTimeXaxisSeries: Date[] = [new Date()];

  errorArr: number[] = [0];
  errRateXaxisSeries: Date[] = [new Date()];

  cpuUtilTimeInterval: any | null = null;
  roboUtilTimeInterval: any | null = null;
  batteryTimeInterval: any | null = null;
  memoryTimeInterval: any | null = null;
  networkTimeInterval: any | null = null;
  idleTimeInterval: any | null = null;
  errTimeInterval: any | null = null;
  selectedDataKey: string = 'data1';
  selectedMetric: string = 'CPU Utilization'; // Initialize with an empty string or a default value

  metrics = {
    Overall: [
      {
        key: 'data1',
        label: 'CPU Utilization',
        name: this.getTranslation('CPU Utilization'),
      },
      {
        key: 'data2',
        label: 'Robot Utilization',
        name: this.getTranslation('Robot Utilization'),
      },
      { key: 'data3', label: 'Memory', name: this.getTranslation('Memory') },
      { key: 'data4', label: 'Network', name: this.getTranslation('Network') },
      {
        key: 'data5',
        label: 'Idletime',
        name: this.getTranslation('Idletime'),
      },
      { key: 'data6', label: 'Error', name: this.getTranslation('Error') },
      { key: 'data7', label: 'Battery', name: this.getTranslation('Battery') },
    ],
    robot: [
      {
        key: 'data1',
        label: 'CPU Utilization',
        name: this.getTranslation('CPU Utilization'),
      },
      { key: 'data3', label: 'Memory', name: this.getTranslation('Memory') },
      { key: 'data4', label: 'Network', name: this.getTranslation('Network') },
      {
        key: 'data5',
        label: 'Idletime',
        name: this.getTranslation('Idletime'),
      },
      { key: 'data6', label: 'Error', name: this.getTranslation('Error') },
      { key: 'data7', label: 'Battery', name: this.getTranslation('Battery') },
    ],
  };

  private abortControllers: Map<string, AbortController> = new Map();

  isFleetMode: boolean = false;
  mapRobos: any = { roboPos: [], simMode: [] };

  private subscriptions: Subscription[] = [];

  constructor(
    private projectService: ProjectService,
    private cdRef: ChangeDetectorRef,
    private translationService: TranslationService,
    private isFleetService: IsFleetService
  ) {
    this.chartOptions = {
      series: [{ name: '', data: this.cpuUtilArr }],
chart: {
  type: 'area',
  height: 250,
  events: {
    zoomed: (chart, options) => {
      this.clearIntervals();
    },
    scrolled: (chart, options) => {
      this.clearIntervals();
    },
    mounted: (chartContext, config) => {
      this.addCustomDownloadButton(chartContext);
    },
    updated: (chartContext, config) => {
      this.addCustomDownloadButton(chartContext);
    }

  },
  toolbar: {
    show: true,
    tools: {
      download: false, // Disable default download
    },
  },
},
      xaxis: {
        categories: this.cpuXaxisSeries,
        type: 'datetime', // Important: Uses timestamps directly
        tickAmount: 6,
        labels: {
          datetimeUTC: false,
          format: 'dd MMM HH:mm',
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
          formatter: function (value: number) {
            return value.toFixed(0); // Ensure two decimal places
          },
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
      dataLabels: {
        enabled: false,
      },
      markers: {
        size: 0,
        colors: ['#8DD98B'],
        strokeColors: '#8DD98B',
        strokeWidth: 2,
        hover: { size: 4 },
      },
      stroke: {
        curve: 'smooth',
        width: 3,
        colors: ['#7854f7'],
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

          // Find the corresponding metric translation
          const metricKey = w.config.series[seriesIndex].name; // Assuming name corresponds to the key
          const translatedMetric = this.getTranslation(this.selectedMetric);

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
private addCustomDownloadButton(chartContext: any): void {
  const toolbar = chartContext.el.querySelector('.apexcharts-toolbar');
  if (!toolbar) return;

  // Remove any existing custom download button first
  const existingBtn = toolbar.querySelector('.apexcharts-custom-download');
  if (existingBtn) {
    existingBtn.remove();
  }

  // Create custom download button
  const downloadBtn = document.createElement('div');
  downloadBtn.className = 'apexcharts-menu-icon apexcharts-custom-download';
  downloadBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  `;
  downloadBtn.title = this.getTranslation("Export as Excel");
  downloadBtn.addEventListener('click', () => this.downloadExcel());

  // Add button to toolbar
  toolbar.appendChild(downloadBtn);
}
// Add these properties to store all historical data
private allCpuData: {value: number, timestamp: number}[] = [];
private allRoboUtilData: {value: number, timestamp: number}[] = [];
private allBatteryData: {value: number, timestamp: number}[] = [];
private allMemoryData: {value: number, timestamp: number}[] = [];
private allNetworkData: {value: number, timestamp: number}[] = [];
private allIdleTimeData: {value: number, timestamp: number}[] = [];
private allErrorData: {value: number, timestamp: number}[] = [];

private downloadExcel(): void {
  try {
    // Get all data for the current metric
    let allData: {value: number, timestamp: number}[] = [];
    let metricName = '';

    switch(this.selectedMetric) {
      case 'CPU Utilization':
        allData = this.allCpuData;
        metricName = 'CPU_Utilization';
        break;
      case 'Robot Utilization':
        allData = this.allRoboUtilData;
        metricName = 'Robot_Utilization';
        break;
      case 'Memory':
        allData = this.allMemoryData;
        metricName = 'Memory';
        break;
      case 'Network':
        allData = this.allNetworkData;
        metricName = 'Network';
        break;
      case 'Idletime':
        allData = this.allIdleTimeData;
        metricName = 'Idle_Time';
        break;
      case 'Error':
        allData = this.allErrorData;
        metricName = 'Error';
        break;
      case 'Battery':
        allData = this.allBatteryData;
        metricName = 'Battery';
        break;
      default:
        console.warn('Unknown metric:', this.selectedMetric);
        return;
    }

    if (!allData || allData.length === 0) {
      console.warn('No data available to download');
      return;
    }

    // Prepare worksheet data
    const wsData = [
      // Header row with styling
      [
        { v: 'Date', t: 's', s: { font: { bold: true }, fill: { fgColor: { rgb: "FFD3D3D3" } } } },
        { v: 'Time', t: 's', s: { font: { bold: true }, fill: { fgColor: { rgb: "FFD3D3D3" } } } },
        { v: metricName, t: 's', s: { font: { bold: true }, fill: { fgColor: { rgb: "FFD3D3D3" } } } }
      ],
      // Data rows
      ...allData.map(dataPoint => {
        const date = new Date(dataPoint.timestamp);
        
        // Create separate date and time strings
        const dateStr = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
        
        return [
          { v: dateStr, t: 's' }, // Date as string in yyyy-mm-dd format
          { v: timeStr, t: 's' }, // Time as string in hh:mm:ss format
          { v: dataPoint.value, t: 'n', s: { numFmt: '0.00' } }
        ];
      })
    ];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Date column width
      { wch: 10 }, // Time column width
      { wch: 15 }  // Value column width
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, metricName);

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, `${metricName}_Data_${new Date().toISOString().slice(0,10)}`);
  } catch (error) {
    console.error('Error generating Excel:', error);
  }
}

private saveAsExcelFile(buffer: any, fileName: string): void {
  const data: Blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(data);
  link.download = `${fileName}.xlsx`;
  link.click();
  
  // Clean up
  setTimeout(() => {
    window.URL.revokeObjectURL(link.href);
    link.remove();
  }, 100);
}
  getMetricTooltip(): string {
    switch(this.selectedMetric) {
      case 'CPU Utilization':
        return  this.getTranslation("cpu_utilization_desc");
      case 'Robot Utilization':
        return this.getTranslation("robot_utilization_desc");
      case 'Memory':
        return  this.getTranslation("memory_desc");
      case 'Network':
        return  this.getTranslation("network_desc");
      case 'Idletime':
        return this.getTranslation("idletime_desc");
      case 'Error':
        return this.getTranslation("error_desc");
      case 'Battery':
        return this.getTranslation("battery_desc");
      default:
        return this.getTranslation("default_metric_desc");
    }
  }
  async ngOnInit() {
    this.currentFilter = 'today';
    this.selectedMap = this.projectService.getMapData();
    if (!this.selectedMap) return;

    this.mapRobos = await this.getRobos();
    this.roboNames = this.swapRobos();

    const isFleet = this.isFleetService.isFleet$.subscribe((status) => {
      this.isFleetMode = status;
      this.roboNames = this.swapRobos();
      this.selectedType = 'Overall';
    });

    this.subscriptions.push(isFleet);

    this.updateChart('data1', 'CPU Utilization');
  }

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

  getTranslation(key: string) {
    return this.translationService.getStatisticsTranslation(key);
  }

  // Update the selected type
  updateSelection(type: string, robo: any): void {
    this.selectedType = type;
    this.selectedRobo = robo;
    this.updateChart(this.selectedDataKey, this.selectedMetric);
  }

  // Get metrics based on the selected type
  getMetrics(type: string): any[] {
    return type === 'Overall' ? this.metrics.Overall : this.metrics.robot;
  }

  updateChart(dataKey: string, metricName: string): void {
    if (!this.selectedMap) return;

    this.selectedDataKey = dataKey;
    this.selectedMetric = metricName;

    const updateFunctions: { [key: string]: () => void } = {
      data1: this.updateCpuUtil.bind(this),
      data2: this.updateRoboUtil.bind(this),
      data3: this.updateMemory.bind(this),
      data4: this.updateNetwork.bind(this),
      data5: this.updateIdleTime.bind(this),
      data6: this.updateErr.bind(this),
      data7: this.updateBattery.bind(this),
    };

    const updateFunction = updateFunctions[dataKey];
    if (updateFunction) updateFunction();
    else console.log(`No update function found for dataKey: ${dataKey}`);
  }

  applyFilter(event: any): void {
    this.currentFilter = event.target.value.toLowerCase();
    // console.log(this.currentFilter, 'current filter');
    const metricToDataKey: { [key: string]: string } = {
      'CPU Utilization': 'data1',
      'Robot Utilization': 'data2',
      Memory: 'data3',
      Network: 'data4',
      'Idle Time': 'data5',
      Error: 'data6',
      Battery: 'data7',
    };

    this.clearIntervals();

    const dataKey = metricToDataKey[this.selectedMetric];
    if (dataKey) this.updateChart(dataKey, this.selectedMetric);
  }

  plotChart(seriesName: string, data: any[], time: any[], limit: number = 12) {
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
            metrics: this.selectedType,
            roboId: this.selectedRobo ? this.selectedRobo.roboId : null,
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
    let currentDate = new Date();
    // Subtract 1 month from the current date
    let lastMonthDate = new Date();
    lastMonthDate.setMonth(currentDate.getMonth() - 1);
    return Math.floor(new Date(lastMonthDate).setHours(0, 0, 0) / 1000);
  }

  // < ---------- >

async updateCpuUtil() {
  this.clearAllIntervals(this.cpuUtilTimeInterval);
  if (this.cpuUtilTimeInterval) return;

  const data = await this.fetchChartData('cpu-utilization', this.currentFilter);

  if (data?.cpuUtil?.CPU_Utilization) {
    this.cpuUtilArr = data.cpuUtil.CPU_Utilization?.map(
      (stat: any) => stat.CPU_Utilization
    );
    this.cpuXaxisSeries = data.cpuUtil.CPU_Utilization?.map(
      (stat: any) => stat.TimeStamp * 1000
    );    
    // Store all data points
    this.allCpuData = data.cpuUtil.CPU_Utilization?.map((stat: any) => ({
      value: stat.CPU_Utilization,
      timestamp: stat.TimeStamp * 1000
    }));
  } else {
    this.cpuUtilArr.length = 0;
    this.cpuXaxisSeries.length = 0;
    this.allCpuData = [];
  }

  this.plotChart('CPU Utilization', this.cpuUtilArr, this.cpuXaxisSeries);
}

  async updateRoboUtil() {
    this.clearAllIntervals(this.roboUtilTimeInterval);
    if (this.roboUtilTimeInterval) return;

    const data = await this.fetchChartData(
      'robo-utilization',
      this.currentFilter
    );

    if (data?.roboUtil?.Robot_Utilization) {
      this.roboUtilArr = data.roboUtil.Robot_Utilization.map(
        (stat: any) => stat.Robot_Utilization
      );
      this.roboXaxisSeries = data.roboUtil.Robot_Utilization.map(
        (stat: any) => stat.TimeStamp * 1000
      );
      this.allRoboUtilData = data.roboUtil.Robot_Utilization?.map((stat: any) => ({
      value: stat.Robot_Utilization,
      timestamp: stat.TimeStamp * 1000
      }));
    } else {
      this.roboUtilArr.length = 0;
      this.roboXaxisSeries.length = 0;
    }

    this.plotChart('Robot Utilization', this.roboUtilArr, this.roboXaxisSeries);

    // this.roboUtilTimeInterval = setInterval(async () => {
    //   const data = await this.fetchChartData(
    //     'robo-utilization',
    //     this.currentFilter
    //   );
    //   if (data?.roboUtil) {
    //     this.roboUtilArr = data.roboUtil.Robot_Utilization.map(
    //       (stat: any) => stat.Robot_Utilization
    //     );
    //     this.roboXaxisSeries = data.roboUtil.Robot_Utilization.map(
    //       (stat: any) => stat.TimeStamp * 1000
    //     );
    //   }
    //   this.plotChart(
    //     'Robot Utilization',
    //     this.roboUtilArr,
    //     this.roboXaxisSeries
    //   );
    // }, 1000 * 2);
  }

  async updateBattery() {
    this.clearAllIntervals(this.batteryTimeInterval);
    if (this.batteryTimeInterval) return;

    const data = await this.fetchChartData('battery', this.currentFilter);

    if (data.batteryStat && data.batteryStat.BatteryPercentage) {
      this.batteryArr = data.batteryStat.BatteryPercentage.map(
        (stat: any) => stat.BatteryPercentage
      );
      this.batteryXaxisSeries = data.batteryStat.BatteryPercentage.map(
        (stat: any) => stat.TimeStamp * 1000
      );
      this.allBatteryData = data.batteryStat.BatteryPercentage?.map((stat: any) => ({
        value: stat.BatteryPercentage,
        timestamp: stat.TimeStamp * 1000
      }));
    } else {
      this.batteryArr.length = 0;
      this.batteryXaxisSeries.length = 0;
    }

    this.plotChart('Battery', this.batteryArr, this.batteryXaxisSeries);

    // this.batteryTimeInterval = setInterval(async () => {
    //   const data = await this.fetchChartData('battery', this.currentFilter);
    //   if (data.batteryStat) {
    //     this.batteryArr = data.batteryStat.BatteryPercentage.map(
    //       (stat: any) => stat.BatteryPercentage
    //     );
    //     this.batteryXaxisSeries = data.batteryStat.BatteryPercentage.map(
    //       (stat: any) => stat.TimeStamp * 1000
    //     );
    //   }
    //   this.plotChart('Battery', this.batteryArr, this.batteryXaxisSeries);
    // }, 1000 * 2);
  }

  async updateMemory() {
    this.clearAllIntervals(this.memoryTimeInterval);
    if (this.memoryTimeInterval) return;

    const data = await this.fetchChartData('memory', this.currentFilter);

    if (data.memoryStat?.Memory) {
      this.memoryArr = data.memoryStat.Memory.map((stat: any) => stat.Memory);
      this.memoryXaxisSeries = data.memoryStat.Memory.map(
        (stat: any) => stat.TimeStamp * 1000
      );
      
      this.allMemoryData = data.memoryStat.Memory?.map((stat: any) => ({
      value: stat.Memory,
      timestamp: stat.TimeStamp * 1000
      }));
    } else {
      this.memoryArr.length = 0;
      this.memoryXaxisSeries.length = 0;
    }

    this.plotChart('Memory', this.memoryArr, this.memoryXaxisSeries);

    // this.memoryTimeInterval = setInterval(async () => {
    //   const data = await this.fetchChartData('memory', this.currentFilter);
    //   if (data.memoryStat) {
    //     this.memoryArr = data.memoryStat.Memory.map((stat: any) => stat.Memory);
    //     this.memoryXaxisSeries = data.memoryStat.Memory.map(
    //       (stat: any) => stat.TimeStamp * 1000
    //     );
    //   }
    //   this.plotChart('Memory', this.memoryArr, this.memoryXaxisSeries);
    // }, 1000 * 2);
  }

  async updateNetwork() {
    this.clearAllIntervals(this.networkTimeInterval);
    if (this.networkTimeInterval) return;

    const data = await this.fetchChartData('network', this.currentFilter);

    if (data.networkUtil && data.networkUtil.Network) {
      this.networkArr = data.networkUtil.Network.map(
        (stat: any) => stat.Network
      );
      this.networkXaxisSeries = data.networkUtil.Network.map(
        (stat: any) => stat.TimeStamp * 1000
      );
      this.allNetworkData = data.networkUtil.Network?.map((stat: any) => ({
      value: stat.Network,
      timestamp: stat.TimeStamp * 1000
      }));
    } else {
      this.networkArr.length = 0;
      this.networkXaxisSeries.length = 0;
    }

    this.plotChart('Network', this.networkArr, this.networkXaxisSeries);

    // this.networkTimeInterval = setInterval(async () => {
    //   const data = await this.fetchChartData('network', this.currentFilter);
    //   if (data.networkUtil) {
    //     this.networkArr = data.networkUtil.Network.map(
    //       (stat: any) => stat.Network
    //     );
    //     this.networkXaxisSeries = data.networkUtil.Network.map(
    //       (stat: any) => stat.TimeStamp * 1000
    //     );
    //   }
    //   this.plotChart('Network', this.networkArr, this.networkXaxisSeries);
    // }, 1000 * 2);
  }

  async updateIdleTime() {
    this.clearAllIntervals(this.idleTimeInterval);

    if (this.idleTimeInterval) return;

    const data = await this.fetchChartData('idle-time', this.currentFilter);
    if (data.idleTime && data.idleTime.IdleTime) {
      this.idleTimeArr = data.idleTime.IdleTime.map(
        (stat: any) => stat.IdleTime
      );
      this.idleTimeXaxisSeries = data.idleTime.IdleTime.map(
        (stat: any) => stat.TimeStamp * 1000
      );
      this.allIdleTimeData = data.idleTime.IdleTime?.map((stat: any) => ({
      value: stat.IdleTime,
      timestamp: stat.TimeStamp * 1000
      }));
    } else {
      this.idleTimeArr.length = 0;
      this.idleTimeXaxisSeries.length = 0;
    }

    this.plotChart('Idle Time', this.idleTimeArr, this.idleTimeXaxisSeries);

    // this.idleTimeInterval = setInterval(async () => {
    //   const data = await this.fetchChartData('idle-time', this.currentFilter);
    //   if (data.idleTime) {
    //     this.idleTimeArr = data.idleTime.IdleTime.map(
    //       (stat: any) => stat.IdleTime
    //     );
    //     this.idleTimeXaxisSeries = data.idleTime.IdleTime.map(
    //       (stat: any) => stat.TimeStamp * 1000
    //     );
    //   }
    //   this.plotChart('Idle Time', this.idleTimeArr, this.idleTimeXaxisSeries);
    // }, 1000 * 2);
  }

  async updateErr() {
    this.clearAllIntervals(this.errTimeInterval);
    if (this.errTimeInterval) return;

    const data = await this.fetchChartData('robo-err', this.currentFilter);

    if (data.roboErr?.RobotError) {
      this.errorArr = data.roboErr.RobotError.map(
        (stat: any) => stat.RobotError
      );
      this.errRateXaxisSeries = data.roboErr.RobotError.map(
        (stat: any) => stat.TimeStamp * 1000
      );
      this.allErrorData = data.roboErr.RobotError?.map((stat: any) => ({
      value: stat.RobotError,
      timestamp: stat.TimeStamp * 1000
      }));
    } else {
      this.errorArr.length = 0;
      this.errRateXaxisSeries.length = 0;
    }

    this.plotChart('Error', this.errorArr, this.errRateXaxisSeries);

    // this.errTimeInterval = setInterval(async () => {
    //   const data = await this.fetchChartData('robo-err', this.currentFilter);

    //   if (data.roboErr) {
    //     this.errorArr = data.roboErr.RobotError.map(
    //       (stat: any) => stat.RobotError
    //     );
    //     this.errRateXaxisSeries = data.roboErr.RobotError.map(
    //       (stat: any) => stat.TimeStamp * 1000
    //     );
    //   }
    //   this.plotChart('Error', this.errorArr, this.errRateXaxisSeries);
    // }, 1000 * 2);
  }

  // < ---------- >

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

  clearIntervals() {
    if (this.cpuUtilTimeInterval) {
      clearInterval(this.cpuUtilTimeInterval);
      this.cpuUtilTimeInterval = null;
    }
    if (this.roboUtilTimeInterval) {
      clearInterval(this.roboUtilTimeInterval);
      this.roboUtilTimeInterval = null;
    }
    if (this.batteryTimeInterval) {
      clearInterval(this.batteryTimeInterval);
      this.batteryTimeInterval = null;
    }
    if (this.memoryTimeInterval) {
      clearInterval(this.memoryTimeInterval);
      this.memoryTimeInterval = null;
    }
    if (this.networkTimeInterval) {
      clearInterval(this.networkTimeInterval);
      this.networkTimeInterval = null;
    }
    if (this.idleTimeInterval) {
      clearInterval(this.idleTimeInterval);
      this.idleTimeInterval = null;
    }
    if (this.errTimeInterval) {
      clearInterval(this.errTimeInterval);
      this.errTimeInterval = null;
    }
  }

  ngOnDestroy() {
    this.clearIntervals();
    this.abortControllers.forEach((controller) => controller?.abort()); // forEach(val, key, map/arr/..)
    this.abortControllers.clear();
  }
}
