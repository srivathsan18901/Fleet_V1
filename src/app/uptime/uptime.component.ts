import { Component, ViewChild, Input, ChangeDetectorRef } from '@angular/core';
import {
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ApexFill,
  ChartComponent,
} from 'ng-apexcharts';
import { environment } from '../../environments/environment.development';
import { ProjectService } from '../services/project.service';

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

  constructor(
    private cdr: ChangeDetectorRef,
    private projectService:ProjectService
  ) {
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
            size: '50%', // Adjusted for better visual balance
          },          
          track: {
            background: '#fee8e8', // Light gray for a soft background
            strokeWidth: '100%',
            margin: 1,
            dropShadow: {
              enabled: true,
              top: 3,
              left: 0,
              blur: 4,
              opacity: 0.24
            }
          },          
          dataLabels: {
            name: {
              show: false,
            },
            value: {
              offsetY: 0,
              fontSize: '28px', // Slightly smaller for a sleeker look
              fontWeight: 'bold',
              color: '#f0453f', // Dark blue for percentage text
            },
          },
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          gradientToColors: ['#f0453f'], // End in bright cyan
          shadeIntensity: 0.5,
          type: 'vertical',
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100],
          colorStops: [
            {
              offset: 0,
              color: '#f0453f', // Start with a vibrant blue
              opacity: 1,
            },
            {
              offset: 100,
              color: '#ffe9e9', // End with bright cyan
              opacity: 1,
            },
          ],
        },
      },
      labels: [''], // Empty label to remove additional text
    };
  }

  async ngOnInit() {
    await this.getUptime();
  }

  getUptimeIfOn() {
    if (this.ONBtn) {
      this.chartOptions.series = [0];
      return;
    }
    this.getUptime();
  }

  async getUptime() {
    const projectId = this.projectService.getSelectedProject()._id;
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-gross-status/system-uptime`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: projectId }),
      }
    );

    let data = await response.json();
    // console.log(data);
    if (data.error) return;
    let { systemUptime } = data;
    this.uptimePercentage = systemUptime;
    
    this.chartOptions.series = [this.uptimePercentage];
  }
}
