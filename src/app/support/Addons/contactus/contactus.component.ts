import { Component } from '@angular/core';

@Component({
  selector: 'app-contactus',
  templateUrl: './contactus.component.html',
  styleUrl: './contactus.component.css'
})
export class ContactusComponent {
  isPopupOpen: boolean = false;
  enquiryOptions: any[] = [
    { label: 'General Inquiry', value: 'General Inquiry' },
    { label: 'Product Info', value: 'Product Info' }
  ];

  openPopup() {
    this.isPopupOpen = true;
  }

  closePopup() {
    this.isPopupOpen = false;
  }
}
