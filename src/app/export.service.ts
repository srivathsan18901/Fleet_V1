import { Injectable } from '@angular/core';
// import * as XLSX from 'xlsx';
import * as jsPDF from 'jspdf';
import * as XLSX from 'xlsx-js-style';

import { BehaviorSubject } from 'rxjs';
import { style } from '@angular/animations';


@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

 

  exportToCSV(data: any[], filename: string, headerStatus: any = {}): void {
    // console.log(data, 'data', headerStatus, 'header');
  
    // console.log(data,'csv data')
    // Apply the header structure if status is true
    if (headerStatus.status) {
      data = headerStatus.structure;
    }
  
    // Convert headers to uppercase
    const keys = Object.keys(data[0]);
    let serialNo=0
    const updatedData = data.map((row) => {
      const newRow: any = {};
      if(headerStatus.status){
        newRow['SERIAL NO']=''
      }else{
        newRow['SERIAL NO']=++serialNo
      }
      keys.forEach((key) => {
        newRow[key.toUpperCase()] = row[key];
      });
      return newRow;
    });

    // Create a worksheet from the updated data
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(updatedData);
  
    // Apply styles to the header row
    const headerRange = XLSX.utils.decode_range(worksheet['!ref']!); 
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { patternType: 'solid', fgColor: { rgb: 'FF3030' } },
          alignment: { horizontal: 'center' },
          border: {
            right: { style: 'thin' },
            left: { style: 'thin' },
            top: { style: 'thin' },
            bottom: { style: 'thin' },
          },
        };
      }
    }
  
    // Dynamically set the column length
    worksheet["!rows"] = [{ hpt: 25 }];
    const worksheetColumnCount: any[] =[];
    for (let i = 0; i <=keys.length; i++) {
      worksheetColumnCount.push({ wch: 23 });
    }
    worksheet["!cols"] = worksheetColumnCount;
  
    // Create a workbook and append the worksheet
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };
  
    // Write the workbook to a file
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    // console.log('Export completed');
  }
  

exportToExcel(data: any[], filename: string, headerStatus: any = {}): void {
  if (headerStatus.status) {
    data = headerStatus.structure;
  }

  // Convert headers to uppercase
  const keys = Object.keys(data[0]);
  let serialNo=0
  const updatedData = data.map((row) => {
    const newRow: any = {};
    if(headerStatus.status){
      newRow['SERIAL NO']=''
    }else{
      newRow['SERIAL NO']=++serialNo
    }
    keys.forEach((key) => {
      newRow[key.toUpperCase()] = row[key];
    });
    return newRow;
  });

  // console.log(updatedData, 'excel data');

  // Create a worksheet using updated data with uppercase headers
  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(updatedData);

  // Apply styles to the header row
  const headerRange = XLSX.utils.decode_range(worksheet['!ref']!);
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'FF3030' } }, // Red background
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          right: { style: 'thin' },
          left: { style: 'thin' },
          top: { style: 'thin' },
          bottom: { style: 'thin' },
        },
      };
    }
  }

  // Adjust row height
  worksheet["!rows"] = [{ hpt: 25 }];

  // Adjust column width dynamically
  const worksheetColumnCount: any[] = [];
  for (let i = 0; i <=keys.length; i++) {
    worksheetColumnCount.push({ wch: 23 });
  }
  worksheet["!cols"] = worksheetColumnCount;

  // Create and save the workbook
  const workbook: XLSX.WorkBook = {
    Sheets: { data: worksheet },
    SheetNames: ['data'],
  };
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

  private emergencyStopSubject = new BehaviorSubject<boolean>(false); // Default to "run"
  emergencyStop$ = this.emergencyStopSubject.asObservable();

  setEmergencyStop(value: boolean): void {
    this.emergencyStopSubject.next(value);
  }

}
