import { Component, OnInit } from '@angular/core';
import {
  ApexNonAxisChartSeries,
  ApexChart,
  ApexPlotOptions,
  ApexFill, // Import ApexFill for colors
  ApexStroke // Import ApexStroke for stroke customization
} from 'ng-apexcharts';
import { ProjectService } from '../services/project.service';
import { environment } from '../../environments/environment.development';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  labels: string[];
  fill: ApexFill; // Add fill property for colors
  stroke: ApexStroke; // Optional: Add stroke for better clarity
};

@Component({
  selector: 'app-radial-chart',
  templateUrl: './radial-chart.component.html',
  styleUrls: ['./radial-chart.component.css'],
})
export class RadialChartComponent implements OnInit {
  public chartOptions!: Partial<ChartOptions>;
  roboStatePie: number[] = [0, 0, 0];
  selectedMap: any | null = null;
  currentFilter: string = 'today'; // To track the selected filter
  totCount: string = '0';

  constructor(private projectService: ProjectService) {
    this.chartOptions = {
      series: this.roboStatePie,
      chart: {
        height: 345,
        type: 'radialBar',
      },
      plotOptions: {
        radialBar: {
          dataLabels: {
            name: {
              fontSize: '30px',
            },
            value: {
              fontSize: '26px',
              fontWeight: 600,
            },
            total: {
              show: true,
              label: 'Total',
              formatter: () => this.totCount, // Dynamic total count
            },
          },
          track: {
            background: '#e0e0e0', // Track background color (grayish)
          },
        },
      },
      fill: {
        colors: ['#59ED9D', '#FECC6A', '#FF6E6E'], // Green, Yellow, Red
      },
      stroke: {
        lineCap: 'round', // Rounded end of bars for better visual
      },
      labels: ['Healthy', 'Inactive', 'Error'], // Label names
    };
  }

  async ngOnInit() {
    if (this.selectedMap) return;
    this.selectedMap = this.projectService.getMapData();
    this.roboStatePie = await this.getRobosStates();
    this.chartOptions.series = [...this.roboStatePie]; // Update series with data
    setInterval(async () => {
      this.roboStatePie = await this.getRobosStates();
      this.chartOptions.series = [...this.roboStatePie];
    }, 1000 * 3); // Update every 3 seconds
  }

  applyFilter(filter: string) {
    this.currentFilter = filter;
    this.updateChartWithFilter();
  }

  async updateChartWithFilter() {
    this.roboStatePie = await this.getRobosStates();
    this.chartOptions.series = [...this.roboStatePie];
  }

  async getRobosStates(): Promise<number[]> {
    let filterParam = this.currentFilter;

    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/stream-data/get-robos-state/${this.selectedMap.id}`,
      {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({}),
      }
    );

    let data = await response.json();
    if (data.error) {
      console.log('Error while getting robot states:', data.error);
      return [0, 0, 0];
    }
    if (!data.map) {
      alert(data.msg);
      return [0, 0, 0];
    }
    if (data.roboStates) {
      let count = 0;
      data.roboStates.forEach((stateCount: number) => {
        count += stateCount;
      });
      this.totCount = count.toString();
      return data.roboStates;
    }
    return [0, 0, 0];
  }
}
