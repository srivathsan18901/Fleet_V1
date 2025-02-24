import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { environment } from '../../environments/environment.development';
import { ProjectService } from './project.service';

(pdfMake as any).vfs = pdfFonts.vfs;

@Injectable({
  providedIn: 'root',
})
export class ExportFileService {
  docDefinition: any = {};

  base64URI: string = '';
  currentFilter: string = 'today';

  selectedMap: any | null = null;

  throughputArr: number[] = [0];
  throughputXaxisSeries: string[] = [];

  starvationArr: number[] = [0, 1];
  starvationXaxisSeries: string[] = [];

  pickAccuracyArr: number[] = [0, 1, 2];
  pickAccXaxisSeries: string[] = [];

  errRateArr: number[] = [0, 1, 2, 3];
  errRateXaxisSeries: string[] = [];

  private abortControllers: Map<string, AbortController> = new Map();

  constructor(private projectService: ProjectService) {
    this.selectedMap = this.projectService.getMapData();
  }

  createDocument() {
    this.docDefinition = {
      content: [
        {
          // layout: 'lightHorizontalLines', // optional,
          // table: {
          //   headerRows: 1,
          //   widths: ['*', 'auto', 100, '*'],
          //   body: [
          //     ['First', 'Second', 'Third', 'The last one'],
          //     ['Value 1', 'Value 2', 'Value 3', 'Value 4'],
          //     [{ text: 'Bold value', bold: true }, 'Val 2', 'Val 3', 'Val 4'],
          //   ],
          // },
        },
      ],
    };

    // pdfMake.createPdf(this.docDefinition).download();
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
      this.starvationArr = data.starvation.map((stat: any) => {
        return Math.round(stat.starvationRate);
      });
      this.starvationXaxisSeries = data.starvation.map(
        (stat: any, index: any) => ++index
      );
    }

    const data3 = await this.fetchChartData('pickaccuracy', this.currentFilter);
    console.log(data3);

    if (data3?.throughput) {
      this.pickAccuracyArr = data.throughput.Stat.map((stat: any) =>
        Math.round(stat.pickAccuracy)
      );
      this.pickAccXaxisSeries = data.throughput.Stat.map(
        (stat: any, index: any) => ++index
      );
    }

    const data4 = await this.fetchChartData('err-rate', this.currentFilter);
    if (data4?.errRate) {
      this.errRateArr = data.errRate.map((stat: any) =>
        Math.round(stat.errorRate)
      );
      this.errRateXaxisSeries = data.errRate.map(
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
