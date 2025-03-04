import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { ProjectService } from './project.service';
import { TranslationService } from '../services/translation.service';
import proud from '../../assets/Export/proud.png';
import robis from '../../assets/Export/robis.png';
import robis_logo from '../../assets/Export/robis_logo.svg';
import Report_name from '../../assets/Export/logo.png';
import data from '../../assets/Export/data.png';
import FMS_name from '../../assets/Export/FMS_name.png';
import Task from '../../assets/Export/Task.png';
import taskDet from '../../assets/Export/taskDet.png';
import blank from '../../assets/Export/blank.png';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { fontVfs } from '../../assets/fonts/font-vfs';
// (pdfMake as any).vfs = pdfFonts.vfs;

@Injectable({
  providedIn: 'root',
})
export class ExportFileService {
  docDefinition: any = {};

  URIStrings: any[] = [];
  donutChartBase64URI: string = '';
  currentFilter: string = 'today';

  graphHeight: number = 180;
  graphWidth: number = 260;

  systemThroughput: number = 0;
  systemUptime: number = 0;
  successRate: number = 0;
  responsiveness: number = 0;

  selectedMap: any | null = null;

  throughputArr: number[] = [0];
  throughputXaxisSeries: string[] = [];

  starvationArr: number[] = [0];
  starvationXaxisSeries: string[] = [];

  pickAccuracyArr: number[] = [0];
  pickAccXaxisSeries: string[] = [];

  errRateArr: number[] = [0];
  errRateXaxisSeries: string[] = [];

  taskData: number[] = [0, 0, 0, 0, 0, 0];

  private abortControllers: Map<string, AbortController> = new Map();

  constructor(private projectService: ProjectService,private translationService: TranslationService,) {
    this.selectedMap = this.projectService.getMapData();
    (pdfMake as any).vfs = { ...pdfMake.vfs, ...fontVfs };

    pdfMake.fonts = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
      },
      NotoSansJP: {
        normal: 'NotoSansJP-Regular.ttf',
        bold: 'NotoSansJP-Bold.ttf',
        italics: 'NotoSansJP-Regular.ttf',
        bolditalics: 'NotoSansJP-Regular.ttf'
      }
    };
  }
  private async convertSvgToImage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      var img = new Image();
      img.src = url;
      img.setAttribute("crossOrigin", "anonymous");

      img.onload = () => {
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        let ctx = canvas.getContext("2d");
        if(ctx) ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      };

      img.onerror = error => {
        reject(error);
      };
      });
  }
  getTranslation(key: string) {
    return this.translationService.getStatisticsTranslation(key);
  }
  async createDocument() {
    const Report_nameImage = await this.convertSvgToImage(Report_name);
    const data_img = await this.convertSvgToImage(data);
    const FMS_name_img = await this.convertSvgToImage(FMS_name);
    const robis_img = await this.convertSvgToImage(robis);
    const proud_img = await this.convertSvgToImage(proud);
    const task_img = await this.convertSvgToImage(Task);
    const taskDet_img = await this.convertSvgToImage(taskDet);
    const blank_img = await this.convertSvgToImage(blank);


    this.docDefinition = {
      pageSize: 'A4',
      pageMargins: [4, 4, 4, 4], // Adjust margins

      content: [
        {
          canvas: [
            {
              type: 'rect',
              x: 5,
              y: 5,
              w: 580,
              h: 825,
              lineColor: 'red',
              lineWidth: 1,
            },
          ],
        },
        // "Fleet Management System" - Top Left
        {
          image: FMS_name_img,
          width:100,
          absolutePosition: { x: 15, y: 15 },
        },
        
        // "robis" SVG - Top Right
        {
          image: robis_img,
          width:50,
          absolutePosition: { x: 530, y: 10 },
        },
        // Footer: "Proud to be part of samvardhana motherson"
        {
          image: proud_img,
          width:150,
          absolutePosition: { x: 15, y: 810 },
        },
        // Footer: "Confidential" - Bottom Right
        {
          text: this.getTranslation("confidential"),
          color: '#DA2128',
          fontSize: 10,
          font: 'NotoSansJP',
          bold: true,
          absolutePosition: { x: 523, y: 815 },
        },

        //Report Name
        { image: Report_nameImage, width: 50, absolutePosition: { x: 230, y: 55 } },
        {
          text: this.getTranslation("taskStatistics"),
          color: '#DA2128',
          fontSize: 15,
          font: 'NotoSansJP',
          bold: true,
          absolutePosition: { x: 280, y: 58 },
        },
        {
          text: this.getTranslation("report"),
          color: '#DA2128',
          fontSize: 15,
          font: 'NotoSansJP',
          bold: true,
          absolutePosition: { x: 280, y: 80 },
        },
        // {
        //   svg: Report_name,
        //   absolutePosition: { x: 230, y: 55 },
        // },
        //Donut
        {
          image: this.donutChartBase64URI,
          width: 300,
          absolutePosition: { x: 30, y: 125 },
        },
        // Taskname
        {
          text: this.getTranslation("taskDetails"),
          fontSize: 15,
          bold: true,
          font: 'NotoSansJP',
          color: 'black',
          background: 'white',
          absolutePosition: { x: 25, y: 125 },
          margin: [10, 5, 10, 5] 
        },
        // {
        //   image: task_img,
        //   width:150,
        //   absolutePosition: { x: 25, y: 120 },
        // },
        // Vertical Line
        // {
        //   canvas: [
        //     {
        //       type: 'line',
        //       x1: 20, y1: 0,
        //       x2: 20, y2: 200,  // Adjust the height of the line
        //       lineWidth: 1,
        //       color: 'black' // Set the color of the line
        //     }
        //   ],
        //   absolutePosition: { x: 350, y: 125 }, // Adjust position based on spacing
        // },     
        //Task_Det
        // { image: blank_img, width: 120,height: 220, absolutePosition: { x: 212, y: 130 } }, 
        // { image: taskDet_img, width: 120, absolutePosition: { x: 215, y: 142 } },   
        
        // {
        //   text: this.getTranslation("completed")+"  "+"-",
        //   color: 'black',
        //   font: 'NotoSansJP',
        //   fontSize: 12,
        //   absolutePosition: { x: 245, y: 147.5 },
        // },
        // {
        //   text: this.getTranslation("assigned")+"  "+"-",
        //   color: 'black',
        //   font: 'NotoSansJP',
        //   fontSize: 12,
        //   absolutePosition: { x: 245, y: 177 },
        // },
        // {
        //   text: this.getTranslation("inProgress")+"  "+"-",
        //   color: 'black',
        //   font: 'NotoSansJP',
        //   fontSize: 12,
        //   absolutePosition: { x: 245, y: 207 },
        // },
        // {
        //   text: this.getTranslation("toDo")+"  "+"-",
        //   color: 'black',
        //   fontSize: 12,
        //   font: 'NotoSansJP',
        //   absolutePosition: { x: 245, y: 237  },
        // },
        // {
        //   text: this.getTranslation("Error")+"  "+"-",
        //   color: 'black',
        //   font: 'NotoSansJP',
        //   fontSize: 12,
        //   absolutePosition: { x: 245, y: 267  },
        // },
        // {
        //   text: this.getTranslation("cancelled")+"  "+"-",
        //   color: 'black',
        //   font: 'NotoSansJP',
        //   fontSize: 12,
        //   absolutePosition: { x: 245, y: 296 },
        // },

        // {
        //   text: this.taskData[0],
        //   color: 'black',
        //   fontSize: 12,
        //   bold: true,
        //   absolutePosition: { x: 345, y: 148.5 },
        // },
        // {
        //   text: this.taskData[1],
        //   color: 'black',
        //   fontSize: 12,
        //   bold: true,
        //   absolutePosition: { x: 345, y: 178 },
        // },
        // {
        //   text: this.taskData[2],
        //   color: 'black',
        //   fontSize: 12,
        //   bold: true,
        //   absolutePosition: { x: 345, y: 208 },
        // },
        // {
        //   text: this.taskData[3],
        //   color: 'black',
        //   fontSize: 12,
        //   bold: true,
        //   absolutePosition: { x: 345, y: 238  },
        // },
        // {
        //   text: this.taskData[4],
        //   color: 'black',
        //   fontSize: 12,
        //   bold: true,
        //   absolutePosition: { x: 345, y: 268  },
        // },
        // {
        //   text: this.taskData[5],
        //   color: 'black',
        //   fontSize: 12,
        //   bold: true,
        //   absolutePosition: { x: 345, y: 297 },
        // },
        //Data
        { image: data_img, width: 160, absolutePosition: { x: 370, y: 165 } },

        // {
        //   svg: data,
        //   width:160,
        //   absolutePosition: { x: 370, y: 155 },
        // },  
        {
          text:this.getTranslation("systemThroughput") + ' -',
          color: 'black',
          font: 'NotoSansJP',
          fontSize: 12,
          absolutePosition: { x: 410, y: 173 },
        },
        {
          text:this.getTranslation("systemUptime") + ' -',
          color: 'black',
          font: 'NotoSansJP',
          fontSize: 12,
          absolutePosition: { x: 410, y: 204 },
        },
        {
          text:this.getTranslation("successRate") + ' -',
          color: 'black',
          font: 'NotoSansJP',
          fontSize: 12,
          absolutePosition: { x: 410, y: 236 },
        },
        {
          text:this.getTranslation("responsiveness") + ' -',
          color: 'black',
          font: 'NotoSansJP',
          fontSize: 12,
          absolutePosition: { x: 410, y: 268 },
        },      
        {
          text: this.systemThroughput + '%',
          color: 'black',
          fontSize: 12,
          bold: true,
          absolutePosition: { x: 544, y: 176 },
        },
        {
          text: this.systemUptime + '%',
          color: 'black',
          fontSize: 12,
          bold: true,
          absolutePosition: { x: 544, y: 207 },
        },
        {
          text: this.successRate + '%',
          color: 'black',
          fontSize: 12,
          bold: true,
          absolutePosition: { x: 544, y: 240 },
        },
        {
          text: this.responsiveness,
          color: 'black',
          fontSize: 12,
          bold: true,
          absolutePosition: { x: 544, y: 272 },
        },
        //0>>>Throughput
        {
          image: this.URIStrings[0],
          height: this.graphHeight,
          width: this.graphWidth,
          absolutePosition: { x: 30, y: 370 },
        },
        {
          text: this.getTranslation("Throughput"),
          color: 'black',
          font: 'NotoSansJP',
          fontSize: 12,
          bold: true,
          absolutePosition: { x: 30, y: 360 },
        },
        {
          text: 'X = '+ this.getTranslation("timeInHours") +   ', Y = '+ this.getTranslation("Throughput"),
          color: '#DA2128',
          font: 'NotoSansJP',
          fontSize: 8,
          bold: true,
          absolutePosition: { x: 100, y: 550 },
        },
        {
          text: 'X = '+ this.getTranslation("timeInHours") +   ', Y = '+ this.getTranslation("numberOfTasks"),
          color: '#DA2128',
          font: 'NotoSansJP',
          fontSize: 8,
          bold: true,
          absolutePosition: { x: 370, y: 550 },
        },
        {
          text: 'X = '+ this.getTranslation("timeInHours") +   ', Y = '+ this.getTranslation("numberOfPicks"),
          color: '#DA2128',
          font: 'NotoSansJP',
          fontSize: 8,
          bold: true,
          absolutePosition: { x: 100, y: 775 },
        },
        {
          text: 'X = '+ this.getTranslation("timeInHours") +   ', Y = '+ this.getTranslation("errors"),
          color: '#DA2128',
          font: 'NotoSansJP',
          fontSize: 8,
          bold: true,
          absolutePosition: { x: 390, y: 775 },
        },
        // {
        //   text: 'X',
        //   color: '#DA2128',
        //   fontSize: 8,
        //   bold: true,
        //   absolutePosition: { x: 290, y: 530 },
        // },
        // {
        //   text: 'Y',
        //   color: '#DA2128',
        //   fontSize: 8,
        //   bold: true,
        //   absolutePosition: { x: 30, y: 450 },
        // },
        //1>>>Starvation Rate
        {
          image: this.URIStrings[1],
          height: this.graphHeight,
          width: this.graphWidth,
          absolutePosition: { x: 305, y: 370 },
        },
        {
          text: this.getTranslation("starvationRate"),
          color: 'black',
          font: 'NotoSansJP',
          fontSize: 12,
          bold: true,
          absolutePosition: { x: 305, y: 360 },
        },
        //2>>>Pick Accuracy
        {
          image: this.URIStrings[2],
          height: this.graphHeight,
          width: this.graphWidth,
          absolutePosition: { x: 30, y: 590 },
        },
        {
          text: this.getTranslation("pickAccuracy"),
          color: 'black',
          font: 'NotoSansJP',
          fontSize: 12,
          bold: true,
          absolutePosition: { x: 30, y: 580 },
        },
        //3>>>Error
        {
          image: this.URIStrings[3],
          height: this.graphHeight,
          width: this.graphWidth,
          absolutePosition: { x: 305, y: 590 },
        },
        {
          text: this.getTranslation("errorRate"),
          color: 'black',
          font: 'NotoSansJP',
          fontSize: 12,
          bold: true,
          absolutePosition: { x: 305, y: 580 },
        },
      ],
    };
    pdfMake.createPdf(this.docDefinition).open();
  }

  async fetchChartData(endpoint: string, timeSpan: string) {
    if (this.abortControllers.has(endpoint))
      this.abortControllers.get(endpoint)?.abort();

    const abortController = new AbortController(); // we can abort one or more requests as when we desired to..
    this.abortControllers.set(endpoint, abortController);

    try {
      let { timeStamp1, timeStamp2 } = this.getTimeStampsOfDay();

      const response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/graph/${endpoint}/${this.selectedMap.id}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timeSpan: timeSpan, // e.g. 'Daily' or 'Weekly'
            timeStamp1: timeStamp1,
            timeStamp2: timeStamp2,
          }),
          signal: abortController.signal,
        }
      );

      return await response.json();
    } catch (error) {
      console.log('Error while fetching chart datum : ', error);
      return;
    } finally {
      this.abortControllers.delete(endpoint);
    }
  }

  async fetchWholeGraph() {
    // if (!this.isFleetUp) return;
    const data = await this.fetchChartData('throughput', this.currentFilter);

    if (data?.throughput) {
      let { Stat } = data.throughput;
      this.throughputArr = Stat.map((stat: any) => stat.TotalThroughPutPerHour);
      this.throughputXaxisSeries = Stat.map((stat: any, index: any) => ++index);
    }

    const data2 = await this.fetchChartData(
      'starvationrate',
      this.currentFilter
    );

    if (data2?.starvation) {
      this.starvationArr = data2.starvation.map((stat: any) => {
        return Math.round(stat.starvationRate);
      });
      this.starvationXaxisSeries = data2.starvation.map(
        (stat: any, index: any) => ++index
      );
    }

    const data3 = await this.fetchChartData('pickaccuracy', this.currentFilter);

    if (data3?.throughput) {
      this.pickAccuracyArr = data3.throughput.Stat.map((stat: any) =>
        Math.round(stat.pickAccuracy)
      );
      this.pickAccXaxisSeries = data3.throughput.Stat.map(
        (stat: any, index: any) => ++index
      );
    }

    const data4 = await this.fetchChartData('err-rate', this.currentFilter);
    if (data4?.errRate) {
      this.errRateArr = data4.errRate.map((stat: any) =>
        Math.round(stat.errorRate)
      );
      this.errRateXaxisSeries = data4.errRate.map(
        (stat: any, index: any) => ++index
      );
    }
  }

  setCurrentFilter(filter: string) {
    this.currentFilter = filter;
  }

  getTimeStampsOfDay() {
    let currentTime = Math.floor(new Date().getTime() / 1000);
    let startTimeOfDay;
    if (this.currentFilter == 'week') {
      startTimeOfDay = this.weekStartOfDay();
    } else if (this.currentFilter == 'month') {
      startTimeOfDay = this.monthStartOfDay();
    } else {
      startTimeOfDay = this.getStartOfDay();
    }

    return {
      timeStamp1: startTimeOfDay,
      timeStamp2: currentTime,
    };
  }

  getStartOfDay() {
    return Math.floor(new Date().setHours(0, 0, 0) / 1000);
  }

  weekStartOfDay() {
    let currentDate = new Date();

    // Subtract 7 days (last week) from the current date
    let lastWeekDate = new Date();
    lastWeekDate.setDate(currentDate.getDate() - 7);

    return Math.floor(new Date(lastWeekDate).setHours(0, 0, 0) / 1000);
  }

  monthStartOfDay() {
    // Get the current date
    let currentDate = new Date();

    // Subtract 1 month from the current date
    let lastMonthDate = new Date();
    lastMonthDate.setMonth(currentDate.getMonth() - 1);
    return Math.floor(new Date(lastMonthDate).setHours(0, 0, 0) / 1000);
  }
}
