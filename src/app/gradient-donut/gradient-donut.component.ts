import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart,
  ApexPlotOptions,
  ApexDataLabels,
  ApexFill,
  ApexLegend,
  ApexTitleSubtitle,
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
  selector: 'app-gradient-donut',
  templateUrl: './gradient-donut.component.html',
  styleUrls: ['./gradient-donut.component.css'],
})
export class GradientDonutComponent implements OnInit {
  @Input() series: ApexNonAxisChartSeries = [];
  @Input() labels: string[] = []; // Labels for each segment
  @Input() chartWidth: number = 400;
  @Input() startAngle: number = -90;
  @Input() endAngle: number = 270;
  @Input() dataLabelsEnabled: boolean = false;
  @Input() fillType: string = 'gradient';
  @Input() titleText: string = 'Total activities';
  @Input() legendFontSize: string = '17px';
  @Input() dataLabelFontSize: string = '14px';
  @Input() responsive: ApexResponsive[] = [
    {
      breakpoint: 480,
      options: {
        chart: {
          width: 220,
        },
        legend: {
          position: 'bottom',
        },
      },
    },
  ];
  @Input() legendFormatter: (val: string, opts: any) => string = (
    val: string,
    opts: any
  ) => {
    return val + ' - ' + opts.w.globals.series[opts.seriesIndex];
  };

  public chartOptions: Partial<ChartOptions> | any;

  constructor() {
    this.chartOptions = {};
  }

  ngOnInit(): void {
    this.chartOptions = {
      series: this.series,
      chart: {
        type: 'donut',
        width: this.chartWidth,
      },
      plotOptions: {
        pie: {
          startAngle: this.startAngle,
          endAngle: this.endAngle,
          donut: {
            size: '60%', // Adjust size to ensure it fits well within the container
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '1.0em',
                fontWeight: 'bold',
                color: '#121212',
                offsetY: -7,
              },
              value: {
                show: true,
                fontSize: '1.5em',
                fontWeight: 'bold',
                color: '#121212',
                offsetY: 6,
                formatter: (val: any) => `${val}%`, // Formatting the value to show percentage
              },
              total: {
                show: true,
                label: 'Total',
                fontSize: '1.2em',
                fontWeight: 'bold',
                color: '#121212',
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: this.dataLabelsEnabled,
        style: {
          fontSize: this.dataLabelFontSize,
          fontWeight: 'bold',
          colors: ['#000000'],
        },
      },
      fill: {
        type: this.fillType,
      },
      legend: {
        fontSize: this.legendFontSize,
        formatter: this.legendFormatter,
        itemMargin: {
          horizontal: 10,
          vertical: 13,
        },
        labels: {
          colors: ['#000000'], // Adjust color as needed
        },
      },
      labels: this.labels,
      title: {
        text: this.titleText,
        align: 'left',
        margin: 10,
        offsetX: 0,
        offsetY: 15,
        floating: false,
        style: {
          fontSize: '1.2em',
          color: '#263238',
        },
      },
      responsive: this.responsive,
    };
  }

  ngOnChanges() {
    // changes: SimpleChanges
    // called when a binded input data property of a component changes..
    this.chartOptions.series = this.series;
  }
}
