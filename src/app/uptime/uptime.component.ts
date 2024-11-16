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

  uptimePercentage: number = 96;
  eventSource!: EventSource;

  constructor(private cdr: ChangeDetectorRef) {
    this.chartOptions = {
      series: [this.uptimePercentage],
      chart: {
        width: 300,
        height: 320,
        type: 'radialBar',
      },
      plotOptions: {
        radialBar: {
          offsetY: -10,
          offsetX: -20,
          startAngle: -90,
          endAngle: 90,
          hollow: {
            size: '60%', // Adjusted for better visual balance
          },
          track: {
            background: '#e5e5e5', // Light gray for a soft background
            strokeWidth: '100%',
            margin: 1,
          },
          dataLabels: {
            name: {
              show: false,
            },
            value: {
              offsetY: 0,
              fontSize: '28px', // Slightly smaller for a sleeker look
              fontWeight: 'bold',
              color: '#004080', // Dark blue for percentage text
            },
          },
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          gradientToColors: ['#00CFFF'], // End in bright cyan
          shadeIntensity: 0.5,
          type: 'vertical',
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100],
          colorStops: [
            {
              offset: 0,
              color: '#0073E6', // Start with a vibrant blue
              opacity: 1,
            },
            {
              offset: 100,
              color: '#00CFFF', // End with bright cyan
              opacity: 1,
            },
          ],
        },
      },
      labels: [''], // Empty label to remove additional text
    };
  }

  ngOnInit() {
    if (!this.ONBtn) return;
    this.getUptime();
  }

  getUptimeIfOn() {
    if (this.ONBtn) {
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
        this.chartOptions.series = [this.uptimePercentage];
        this.cdr.detectChanges();
      };
    } catch (error) {}
    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.eventSource.close();
    };
  }
}
