import { Component, ViewChild,Input,ChangeDetectorRef } from '@angular/core';
import {
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ApexFill,
  ApexStroke,
  ChartComponent
} from "ng-apexcharts";
import { ProjectService } from '../services/project.service';
import { environment } from '../../environments/environment.development';
import { map } from 'rxjs';
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
  @Input() isFleet!:boolean;
  robos: any[] = [];

  public chartOptions: Partial<ChartOptions>;
  public activeRobots: number = 0; // Example active robots count
  public totalRobots: number = 0; // Example total robots count
  simMode:any[]=[];
  mapData:any|null=null;
  constructor(
    private projectService: ProjectService,
    private cdRef: ChangeDetectorRef
  ) {
    const activeToTotal = `${this.activeRobots} / ${this.totalRobots}`;
    const percentage = (this.activeRobots / this.totalRobots) * 100;

    this.chartOptions = {
      series: [percentage], // Pass the percentage value
      chart: {
        width: 240,
        height: 250,
        type: "radialBar",
        offsetX: -5, // Horizontal offset
        offsetY: -10, // Vertical offset
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
              top: 3,
              left: 0,
              blur: 4,
              opacity: 0.24
            }
          },
          track: {
            background: "#FFE5E5",
            strokeWidth: "100%",
            margin: 5
          },
          dataLabels: {
            show: true,
            name: {
              offsetY: 80,
              show: false
            },
            value: {
              formatter: function () {
                return activeToTotal; // Display the active/total format
              },
              offsetY: 10,
              color: "#F71717",
              fontSize: "20px",
              fontWeight: "semibold",
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
          stops: [0, 2],
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
      labels: ["Active Robots"]
    };
  }
  async ngOnInit() {    
    await this.getMapDetails();
    this.totalRobots = this.simMode.length;
    this.activeRobots = await this.getLiveRoboInfo();
    // console.log(this.activeRobots,this.totalRobots);
    const percentage = (this.activeRobots / this.totalRobots) * 100;

    // Ensure the required objects exist before assignment
    if (
      this.chartOptions &&
      this.chartOptions.plotOptions &&
      this.chartOptions.series&&
      this.chartOptions.plotOptions.radialBar &&
      this.chartOptions.plotOptions.radialBar.dataLabels
    ) 
    {
      this.chartOptions.series=[percentage]
      this.chartOptions.plotOptions.radialBar.dataLabels.value = {
        ...this.chartOptions.plotOptions.radialBar.dataLabels.value,
        formatter: () => this.getTotalRobos(), // Ensure 'this' is correctly bound
      };
      
    }
  }
  
  async getMapDetails() {
    this.mapData = this.projectService.getMapData();
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${this.mapData.mapName}`
    );
    if (!response.ok)
      throw new Error(`Error with status code of ${response.status}`);
    let data = await response.json();
    if (!data.map) return;
    let mapDet = data.map;  

    this.robos = mapDet.roboPos;
    this.simMode= mapDet.simMode;
    this.totalRobots = this.simMode.length;
    // yet to check..
    // if(!this.isInLive)
    // this.simMode = mapData.simMode.map((robo: any) => {
    //   robo.pos.x = robo.pos.x / (this.ratio || 1);
    //   robo.pos.y = robo.pos.y / (this.ratio || 1);

    //   return robo;
    // });

  }
  getTotalRobos(){
    return `${this.activeRobots} / ${this.totalRobots}`;
  }
  async getLiveRoboInfo(): Promise<number> {
    if(!this.mapData) return 0;
    const response = await fetch(`http://${environment.API_URL}:${environment.PORT}/stream-data/get-live-robos/${this.mapData.id}`, {
      method: 'GET',
      credentials: 'include'
    });

    const data = await response.json();
    if (!data.map || data.error) return 0;
    return data.robos.count||0;
  }

 ngOnChanges() {
    
    if(this.isFleet){         
      this.totalRobots = this.robos.length;
      
      const percentage = (this.activeRobots / this.totalRobots) * 100;

      // Ensure the required objects exist before assignment
      if (
        this.chartOptions &&
        this.chartOptions.plotOptions &&
        this.chartOptions.series&&
        this.chartOptions.plotOptions.radialBar &&
        this.chartOptions.plotOptions.radialBar.dataLabels
      ) 
      {
        this.chartOptions.series=[percentage]
        this.chartOptions.plotOptions.radialBar.dataLabels.value = {
          ...this.chartOptions.plotOptions.radialBar.dataLabels.value,
          formatter: () => this.getTotalRobos(), // Ensure 'this' is correctly bound
        };
      }
    }
    else{
            
      this.totalRobots = this.simMode.length;
      
      const percentage = (this.activeRobots / this.totalRobots) * 100;

      // Ensure the required objects exist before assignment
      if (
        this.chartOptions &&
        this.chartOptions.plotOptions &&
        this.chartOptions.series&&
        this.chartOptions.plotOptions.radialBar &&
        this.chartOptions.plotOptions.radialBar.dataLabels
      ) 
      {
        this.chartOptions.series=[percentage]
        this.chartOptions.plotOptions.radialBar.dataLabels.value = {
          ...this.chartOptions.plotOptions.radialBar.dataLabels.value,
          formatter: () => this.getTotalRobos(), // Ensure 'this' is correctly bound
        };
      }
      }
      
  }
}
