import {
  Component,
  ChangeDetectorRef,
  OnInit,
  Input,
  OnChanges,
  ViewChild,
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
  ChartComponent,
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
import { Subscription } from 'rxjs';
import { TranslationService } from '../services/translation.service';
@Component({
  selector: 'app-gradient-donut',
  templateUrl: './gradient-donut.component.html',
  styleUrls: ['./gradient-donut.component.css'],
})
export class GradientDonutComponent implements OnInit {
  @Input() series: ApexNonAxisChartSeries = [];
  @Input() labels: string[] = []; // Labels for each segment
  @Input() chartWidth: number = 400;
  @Input() chartHeight: number = 334;
  @Input() startAngle: number = -90;
  @Input() endAngle: number = 270;
  @Input() dataLabelsEnabled: boolean = false;
  @Input() fillType: string = 'gradient';
  @Input() titleText: string = 'Total activities';
  @Input() legendFontSize: string = '16px';
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
  @ViewChild('chart') chart!: ChartComponent;

  public chartOptions: Partial<ChartOptions> | any;

  constructor(
    private translationService: TranslationService,
    private cdRef: ChangeDetectorRef
  ) {
    this.chartOptions = {};
  }

  getTranslation(key: string) {
    return this.translationService.getStatisticsTranslation(key);
  }

  private langSubscription!: Subscription;

  async ngOnInit() {
    this.langSubscription = this.translationService.currentLanguage$.subscribe(
      (val) => {
        this.chartOptions = {
          series: this.series,
          chart: {
            type: 'donut',
            width: this.chartWidth,
            height: this.chartHeight,
          },
          plotOptions: {
            pie: {
              startAngle: this.startAngle,
              endAngle: this.endAngle,
              donut: {
                size: '50%', // Adjust size to ensure it fits well within the container
                labels: {
                  show: true,
                  name: {
                    show: true,
                    fontSize: '1.0em',
                    fontWeight: 'bold',
                    color: '#121212',
                    offsetY: -7,
                    style: { fontFamily: '"Graphik", Arial, sans-serif' },
                  },
                  value: {
                    show: true,
                    fontSize: '1.5em',
                    fontWeight: 'bold',
                    color: '#121212',
                    offsetY: 6,
                    formatter: (val: any) => `${val}`, // Formatting the value to show percentage
                    style: { fontFamily: '"Graphik", Arial, sans-serif' },
                  },
                  total: {
                    show: true,
                    label: this.getTranslation('total'),
                    fontSize: '1.0em',
                    fontWeight: 'bold',
                    color: '#121212',
                    style: { fontFamily: '"Graphik", Arial, sans-serif' },
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
              fontFamily: '"Graphik", Arial, sans-serif',
            },
          },
          fill: {
            type: this.fillType,
          },
          legend: {
            fontSize: this.legendFontSize,
            fontWeight: 'bold',
            formatter: this.legendFormatter,
            itemMargin: {
              horizontal: 10,
              vertical: 10,
            },
            labels: {
              colors: ['#000000'], // Adjust color as needed
              style: { fontFamily: '"Graphik", Arial, sans-serif' },
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
              fontFamily: '"Graphik", Arial, sans-serif',
            },
          },
          responsive: this.responsive,
        };
        this.cdRef.detectChanges();
      }
    );
    this.chartOptions = {
      series: this.series,
      chart: {
        type: 'donut',
        width: this.chartWidth,
        height: this.chartHeight,
      },
      plotOptions: {
        pie: {
          startAngle: this.startAngle,
          endAngle: this.endAngle,
          donut: {
            size: '50%', // Adjust size to ensure it fits well within the container
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '1.0em',
                fontWeight: 'bold',
                color: '#121212',
                offsetY: -7,
                style: { fontFamily: '"Graphik", Arial, sans-serif' },
              },
              value: {
                show: true,
                fontSize: '1.5em',
                fontWeight: 'bold',
                color: '#121212',
                offsetY: 6,
                formatter: (val: any) => `${val}`, // Formatting the value to show percentage
                style: { fontFamily: '"Graphik", Arial, sans-serif' },
              },
              total: {
                show: true,
                label: this.getTranslation('total'),
                fontSize: '1.0em',
                fontWeight: 'bold',
                color: '#121212',
                style: { fontFamily: '"Graphik", Arial, sans-serif' },
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
          fontFamily: '"Graphik", Arial, sans-serif',
        },
      },
      fill: {
        type: this.fillType,
      },
      legend: {
        fontSize: this.legendFontSize,
        fontWeight: 'bold',
        formatter: this.legendFormatter,
        itemMargin: {
          horizontal: 10,
          vertical: 10,
        },
        labels: {
          colors: ['#000000'], // Adjust color as needed
          style: { fontFamily: '"Graphik", Arial, sans-serif' },
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
          fontFamily: '"Graphik", Arial, sans-serif',
        },
      },
      responsive: this.responsive,
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['series'] || changes['labels'] || changes['titleText']) {
      this.chartOptions = {
        ...this.chartOptions, // Keep existing settings
        series: this.series,
        labels: this.labels,
        title: {
          text: this.titleText, // Update title dynamically
          align: 'left',
          margin: 10,
          offsetX: 0,
          offsetY: 15,
          floating: false,
          style: {
            fontSize: '1.2em',
            color: '#263238',
            fontFamily: '"Graphik", Arial, sans-serif',
          },
        },
      };
    }
  }

  async getChart(): Promise<any> {
    let result = await this.chart.dataURI();
    return (result as { imgURI: string }).imgURI; // type assertion
  }
}
