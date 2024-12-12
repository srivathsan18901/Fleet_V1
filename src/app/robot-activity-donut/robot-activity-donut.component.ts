import { Component, OnInit, Input } from '@angular/core';
import { ApexNonAxisChartSeries, ApexResponsive, ApexChart, ApexDataLabels, ApexFill, ApexLegend, ApexPlotOptions } from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  fill: ApexFill;
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  labels: string[];
  responsive: ApexResponsive[];
};

@Component({
  selector: 'app-robot-activity-donut',
  templateUrl: './robot-activity-donut.component.html',
  styleUrls: ['./robot-activity-donut.component.css']
})
export class RobotActivityDonutComponent implements OnInit {
  @Input() series: number[] = [24, 26, 39, 11];  // Live data series input
  @Input() labels: string[] = ["Approved", "Pending", "Under review", "Rejected"];  // Labels for each segment

  public chartOptions: Partial<ChartOptions>;

  constructor() {
    // Initialize with empty values to avoid undefined errors
    this.chartOptions = {
      series: [],
      chart: {
        type: 'donut',
        height: 350,
      },
      plotOptions: {
        pie: {
          startAngle: -90,
          endAngle: 270,
          donut: {
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Average range',
                formatter: () => '1.05'
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: "vertical",
          shadeIntensity: 0.5,
          gradientToColors: ["#FF5B5B", "#FFC300", "#FF8C8C", "#FFC300"],  // Gradient colors for each segment
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
        },
      },
      legend: {
        formatter: (val: string, opts: any) => {
          return val + ": " + opts.w.globals.series[opts.seriesIndex];
        },
        position: 'right',
      },
      labels: [],
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: 'bottom'
          }
        }
      }]
    };
  }

  ngOnInit(): void {
    // Populate the chart options with actual data during initialization
    this.chartOptions.series = this.series || [];  // Default to empty array if series is undefined
    this.chartOptions.labels = this.labels || [];  // Default to empty array if labels are undefined
  }
}
