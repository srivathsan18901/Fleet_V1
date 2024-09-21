import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import * as jsPDF from 'jspdf';


@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  exportToCSV(data: any[], filename: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    XLSX.writeFile(workbook, `${filename}.csv`);
  }

  exportToExcel(data: any[], filename: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  exportToPDF(data: any[], filename: string): void {
    const doc = new jsPDF.default();
    (doc as any).autoTable({
      head: [Object.keys(data[0])],
      body: data.map(row => Object.values(row))
    });
    doc.save(`${filename}.pdf`);
  }
}
