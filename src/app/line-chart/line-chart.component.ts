import { Component, ViewChild, Input, OnInit } from '@angular/core';
import {
  ApexChart,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexYAxis,
  ApexStroke,
  ApexGrid,
  ChartComponent
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  grid: ApexGrid;
};

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css']
})
export class LineChartComponent implements OnInit {
  @ViewChild("chart") chart: ChartComponent | undefined;
  public chartOptions: ChartOptions;

  @Input() data: number[] = [];  // Data passed to the component

  constructor() {
    // Initialize chartOptions with default values
    this.chartOptions = {
      series: [
        {
          name: "Trend",
          data: [0]  // Dummy data for initialization
        }
      ],
      chart: {
        type: "line",
        width: '100%',  // Full width of its container
        height: '100%',  // Full height of its container
        sparkline: {
          enabled: true  // Removes axes and labels for a minimalist design
        }
      },
      stroke: {
        curve: "straight",  // Sharp, angular lines
        width: 2,  // Line thickness
        colors: ["#00FF00"]  // Bright green color
      },
      xaxis: {
        categories: [],
        labels: {
          show: false  // No x-axis labels
        }
      },
      yaxis: {
        labels: {
          show: false  // No y-axis labels
        }
      },
      grid: {
        show: false  // No grid lines
      }
    };
  }

  ngOnInit() {
    // Update chartOptions with actual data
    this.chartOptions.series = [
      {
        name: "Trend",
        data: this.data  // Use the input data
      }
    ];
    this.chartOptions.xaxis.categories = Array.from({ length: this.data.length }, (_, i) => i + 1);
  }
}
