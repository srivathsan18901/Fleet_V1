import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { environment } from '../../environments/environment.development';
import { ProjectService } from './project.service';

import proud from '../../assets/Export/proud.svg';
import robis from '../../assets/Export/robis.svg';
import robis_logo from '../../assets/Export/robis_logo.svg';
import Report_name from '../../assets/Export/image.png';
import data from '../../assets/Export/data.svg';


(pdfMake as any).vfs = pdfFonts.vfs;

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

  private abortControllers: Map<string, AbortController> = new Map();

  constructor(private projectService: ProjectService) {
    this.selectedMap = this.projectService.getMapData();
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
  
  async createDocument() {
    const Report_nameImage = await this.convertSvgToImage(Report_name);
    
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
          svg: robis,
          absolutePosition: { x: 15, y: 15 },
        },
        // "robis" SVG - Top Right
        {
          svg: robis_logo,
          absolutePosition: { x: 520, y: 15 },
        },
        // Footer: "Proud to be part of samvardhana motherson"
        {
          svg: proud,
          absolutePosition: { x: 15, y: 810 },
        },
        // Footer: "Confidential" - Bottom Right
        {
          text: 'Confidential',
          color: 'red',
          fontSize: 8,
          bold: true,
          absolutePosition: { x: 535, y: 815 },
        },
        //Report Name
        { image: Report_nameImage, width: 180, absolutePosition: { x: 230, y: 55 } },
        // {
        //   svg: Report_name,
        //   absolutePosition: { x: 230, y: 55 },
        // },
        //Donut
        {
          image: this.donutChartBase64URI,
          width: 300,
          absolutePosition: { x: 35, y: 125 },
        },
        //Data
        {
          svg: data,
          width:160,
          absolutePosition: { x: 370, y: 155 },
        },
        {
          text: this.systemThroughput,
          color: 'black',
          fontSize: 15,
          bold: true,
          absolutePosition: { x: 530, y: 163 },
        },
        {
          text: this.systemUptime,
          color: 'black',
          fontSize: 15,
          bold: true,
          absolutePosition: { x: 530, y: 196 },
        },
        {
          text: this.successRate,
          color: 'black',
          fontSize: 15,
          bold: true,
          absolutePosition: { x: 530, y: 228 },
        },
        {
          text: this.responsiveness,
          color: 'black',
          fontSize: 15,
          bold: true,
          absolutePosition: { x: 530, y: 260 },
        },
        //0>>>Throughput
        {
          image: this.URIStrings[0],
          height: this.graphHeight,
          width: this.graphWidth,
          absolutePosition: { x: 30, y: 380 },
        },
        {
          text: 'Throughput',
          color: 'black',
          fontSize: 12,
          bold: true,
          absolutePosition: { x: 30, y: 370 },
        },
        //1>>>Starvation Rate
        {
          image: this.URIStrings[1],
          height: this.graphHeight,
          width: this.graphWidth,
          absolutePosition: { x: 305, y: 380 },
        },
        {
          text: 'Starvation Rate',
          color: 'black',
          fontSize: 12,
          bold: true,
          absolutePosition: { x: 305, y: 370 },
        },
        //2>>>Pick Accuracy
        {
          image: this.URIStrings[2],
          height: this.graphHeight,
          width: this.graphWidth,
          absolutePosition: { x: 30, y: 590 },
        },
        {
          text: 'Pick Accuracy',
          color: 'black',
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
          text: 'Error',
          color: 'black',
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
