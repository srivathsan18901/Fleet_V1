import { Component, OnInit } from '@angular/core';
import {
  ApexNonAxisChartSeries,
  ApexChart,
  ApexPlotOptions,
  
} from 'ng-apexcharts';
import { ProjectService } from '../services/project.service';
import { environment } from '../../environments/environment.development';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  labels: string[];
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

  constructor(private projectService: ProjectService) {
    this.chartOptions = {
      series: this.roboStatePie,
      chart: {
        height: 370,
        type: 'radialBar',
      },
      plotOptions: {
        radialBar: {
          dataLabels: {
            name: {
              fontSize: '40px',
            },
            value: {
              fontSize: '30px',
            },
            total: {
              show: true,
              label: 'Total',
              formatter: this.getTotalRoboCounts,
            },
            
          },
        },
      },
      labels: ['Healthy', 'Inactive', 'Error'],
    };
  }

  getColor(index: number): string {
    const colors = ['#FF0000', '#00FF00', '#0000FF']; // Example colors, adjust based on your chart segments
    return colors[index % colors.length]; // Cycle through colors if you have more labels than colors
  }
  

  async ngOnInit() {
    if (this.selectedMap) return;
    this.selectedMap = this.projectService.getMapData();
    this.roboStatePie = await this.getRobosStates();
    this.chartOptions.series = this.roboStatePie;
    setInterval(async () => {
      this.roboStatePie = await this.getRobosStates();
      this.chartOptions.series = this.roboStatePie;
    }, 1000 * 3);
  }

  // Apply filter function when a filter is selected
  applyFilter(filter: string) {
    this.currentFilter = filter; // Update the current filter
    this.updateChartWithFilter(); // Re-fetch data with the new filter
  }

  async updateChartWithFilter() {
    // Fetch filtered robot states
    this.roboStatePie = await this.getRobosStates();
    this.chartOptions.series = this.roboStatePie;
  }

  getTotalRoboCounts() {
    return '32'; // Example value
  }

  async getRobosStates(): Promise<number[]> {
    let filterParam = this.currentFilter; // Pass filter to backend

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
      console.log('Err occurred while getting tasks status:', data.error);
      return [0, 0, 0];
    }
    if (!data.map) {
      alert(data.msg);
      return [0, 0, 0];
    }
    if (data.roboStates) return data.roboStates;
    return [0, 0, 0];
  }
}
