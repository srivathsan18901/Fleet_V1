import { Component, ViewChild, Input, ChangeDetectorRef } from '@angular/core';
import {
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ApexFill,
  ChartComponent,
} from 'ng-apexcharts';
import { environment } from '../../environments/environment.development';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
};

@Component({
  selector: 'app-uptime',
  templateUrl: './uptime.component.html',
  styleUrls: ['./uptime.component.css'],
})
export class UptimeComponent {
  @ViewChild('chart') chart!: ChartComponent;
  @Input() ONBtn!: boolean;
  public chartOptions: Partial<ChartOptions>;

  uptimePercentage: number = 0;
  eventSource!: EventSource;

  constructor(private cdr: ChangeDetectorRef) {
    this.chartOptions = {
      series: [this.uptimePercentage],
      chart: {
        width: 280, // Increased width
        height: 320, // Increased height
        type: 'radialBar',
      },
      plotOptions: {
        radialBar: {
          offsetY: -15,
          offsetX: -20,
          startAngle: -90,
          endAngle: 90,
          hollow: {
            size: '70%', // Adjust the hollow size to reduce the bar width
          },
          track: {
            background: '#e7e7e7',
            strokeWidth: '70%',
            margin: 1, // margin is in pixels
          },
          dataLabels: {
            name: {
              show: true,
              offsetY: 45, // Adjusted to fit the larger chart size
              fontSize: '16px', // Increased font size
              color: '#FF3333',
            },
            value: {
              offsetY: 0, // Adjusted to fit the larger chart size
              fontSize: '40px', // Increased font size
              color: '#FF3333',
            },
          },
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          shadeIntensity: 0.4,
          gradientToColors: ['#FFB3B3'],
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100],
          colorStops: [
            {
              offset: 0,
              color: '#FFB3B3',
              opacity: 1,
            },
            {
              offset: 100,
              color: '#FF3333',
              opacity: 1,
            },
          ],
        },
      },
      labels: ['Average Time'],
    };
  }

  ngOnInit() {
    if (!this.ONBtn) return;
    this.getUptime();
  }

  getUptimeIfOn() {
    if (this.ONBtn) {
      // alter the logic, cz of toggling function in button..
      if (this.eventSource) this.eventSource.close();
      this.chartOptions.series = [0];
      return;
    }
    this.getUptime();
  }

  getUptime() {
    if (this.eventSource) this.eventSource.close();
    let URL = `http://${environment.API_URL}:${environment.PORT}/dashboard/uptime/map123`;
    this.eventSource = new EventSource(URL);
    try {
      this.eventSource.onmessage = (event) => {
        const uptime = JSON.parse(event.data);
        this.uptimePercentage = uptime.percentage;
        this.chartOptions.series = [this.uptimePercentage]; // this.uptimePercentage
        this.cdr.detectChanges(); // it's impt
        // console.log(this.uptimePercentage);
      };
    } catch (error) {}
    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.eventSource.close();
    };
  }
}
