import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { environment } from '../../environments/environment.development';

interface Poll {
  ip: string;
  mac: string;
  host: string;
  ping: string;
  Status: string;
  // hostname: string;
}
@Component({
  selector: 'app-ipscanner',
  templateUrl: './ipscanner.component.html',
  styleUrls: ['./ipscanner.component.css'], // Changed styleUrl to styleUrls
})
export class IPScannerComponent {
  @Output() close = new EventEmitter<void>();
  constructor(private cdr: ChangeDetectorRef) {} // need to rem in later..
  eventSource!: EventSource; // non-null assertion operator..
  startIP: string = '0.0.0.0';
  EndIP: string = '0.0.0.0';
  ipScanData: Poll[] = [];

  showIPScannerPopup = false;

  openIPScanner() {
    this.showIPScannerPopup = true;
  }
  startScanning() {
    this.ipScanData = [];
    this.startIP = (
      document.getElementById('ipRangeFrom') as HTMLInputElement
    ).value;
    this.EndIP = (
      document.getElementById('ipRangeTo') as HTMLInputElement
    ).value;
    if (this.startIP === '' || this.EndIP === '') {
      alert('Enter valid Ip');
      return;
    }
    const ipv4Regex =
      /^(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipv4Regex.test(this.startIP) || !ipv4Regex.test(this.EndIP)) {
      alert('not valid IP. Try again');
      return;
    }

    const URL = `http://${environment.API_URL}:${environment.PORT}/fleet-config/scan-ip/${this.startIP}-${this.EndIP}`;

    if (this.eventSource) this.eventSource.close();

    this.eventSource = new EventSource(URL);
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        let poll: Poll = {
          ip: data.ip_address,
          mac:
            data.mac_address === '' || data.mac_address === 'undefined'
              ? '00:00:00:00:00:00'
              : data.mac_address,
          host: data.host,
          ping: data.time,
          Status: data.status,
          // hostname: data.host,
        };

        this.ipScanData.push(poll);
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.eventSource.close();
    };
  }
  stopScanning() {
    this.eventSource.close();
    return;
  }

  closeIPScanner() {
    this.showIPScannerPopup = false;
    this.close.emit(); // Emitting the close event
  }
}
