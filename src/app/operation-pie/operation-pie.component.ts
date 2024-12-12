import { Component, OnInit } from '@angular/core';
import {
  ApexNonAxisChartSeries,
  ApexChart,
  ApexResponsive,
  ApexPlotOptions,
  ApexDataLabels,
  ApexFill,
  ApexLegend,
  ApexTitleSubtitle
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  fill: ApexFill;
  legend: ApexLegend;
  labels: string[];
  title: ApexTitleSubtitle;
  responsive: ApexResponsive[];
};

@Component({
  selector: 'app-operation-pie',
  templateUrl: './operation-pie.component.html',
  styleUrls: ['./operation-pie.component.css']
})
export class OperationPieComponent implements OnInit {
  public chartOptions: ChartOptions; // Remove Partial to ensure all options are required

  constructor() {
    this.chartOptions = {
      series: [60, 30, 10],
      chart: {
        width: 420,
        type: 'pie'
      },
      plotOptions: {
        pie: {
          donut: {
            size: '60%' // Adjust size as needed
          }
        }
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '16px'
          
          
        }
      },
      fill: {
        type: 'gradient'
      },
      legend: {
        fontSize: '17px',
        labels: {
          colors: ['#000']
        },
        itemMargin: {
          horizontal: 10,
          vertical: 25
        }
      },
      labels: ['Active', 'Inactive', 'Error'],
      title: {
        text: 'Robots',
        align: 'left',
        
      },
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

  ngOnInit(): void {}
}
