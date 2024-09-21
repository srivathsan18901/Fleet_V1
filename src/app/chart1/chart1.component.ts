import { Component, ViewChild } from '@angular/core';
import {
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ApexFill,
  ApexStroke,
  ChartComponent
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  stroke: ApexStroke;
};

@Component({
  selector: 'app-chart1',
  templateUrl: './chart1.component.html',
  styleUrls: ['./chart1.component.css']
})
export class Chart1Component {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions>;

  constructor() {
    const percentage = 74; // Define the percentage to display

    this.chartOptions = {
      series: [percentage],
      chart: {
        width: 270,
        height: 270,
        type: "radialBar",
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        radialBar: {
          startAngle: 0,
          endAngle: 360,
          hollow: {
            margin: 0,
            size: "50%",
            background: "#fff",
            dropShadow: {
              enabled: true,
              top: 2,
              left: 0,
              blur: 4,
              opacity: 0.24
            }
          },
          track: {
            background: "#FFE5E5",
            strokeWidth: "100%",
            margin: 0
          },
          dataLabels: {
            show: true,
            name: {
              offsetY: 85,
              show: false,  // Hide the name label
            },
            value: {
              formatter: function(val) {
                return `${val}%`;  // Display the percentage
              },
              offsetY: 12,
                // Center the text vertically
              color: "#000000",
              fontSize: "35px",
              fontWeight: "bold",  // Make the text bold
              show: true
            }
          }
        }
      },
      fill: {
        type: "gradient",
        gradient: {
          shade: "dark",
          type: "vertical",
          shadeIntensity: 0.1,
          gradientToColors: ["#FFFFFF"],
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100],
          colorStops: [
            {
              offset: 0,
              color: "#D30000",
              opacity: 1
            },
            {
              offset: 80,
              color: "#FF8585",
              opacity: 1
            }
          ]
        }
      },
      stroke: {
        lineCap: "round"
      },
      labels: [""]
    };
  }
}
