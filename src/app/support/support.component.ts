import { Component } from '@angular/core';

import { Router } from '@angular/router'; // Import Router

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrl: './support.component.css'
})
export class SupportComponent {
  constructor(private router: Router) { } // Inject the router
  faqs = [
    {
      iconUrl: 'assets/icons/free-trial.svg',
      question: 'Is there a free trial available?',
      answer: 'Yes, you can try us for free for 30 days. If you want, we’ll provide you with a free 30-minute onboarding call to get you up and running.'
    },
    {
      iconUrl: 'assets/icons/cancellation-policy.svg',
      question: 'What is your cancellation policy?',
      answer: 'We understand that things change. You can cancel your plan at any time and we’ll refund you the difference already paid.'
    },
    {
      iconUrl: 'assets/icons/billing.svg',
      question: 'How does billing work?',
      answer: 'Plans are per workspace, not per account. You can upgrade one workspace, and still have any number of free workspaces.'
    },
    {
      iconUrl: 'assets/icons/support.svg',
      question: 'How does support work?',
      answer: 'If you’re having trouble, we’re here to help via email. We’re a small team but will get back to you soon.'
    },
    {
      iconUrl: 'assets/icons/plan-change.svg',
      question: 'Can I change my plan later?',
      answer: 'Of course you can! Our pricing scales with your company. Chat with our friendly team to find a solution that works for you as you grow.'
    },
    {
      iconUrl: 'assets/icons/invoice.svg',
      question: 'Can other info be added to an invoice?',
      answer: 'At the moment, the only way to add additional information to invoices is to add it to the workspace’s name manually.'
    },
    {
      iconUrl: 'assets/icons/email-change.svg',
      question: 'How do I change my account email?',
      answer: 'You can change the email address associated with your account by going to your account settings on a laptop or desktop.'
    },
    {
      iconUrl: 'assets/icons/tutorials.svg',
      question: 'Do you provide tutorials?',
      answer: 'Not yet, but we’re working on it! We’ve done our best to make it intuitive and are building out the documentation.'
    }
  ];

  visibleFaqs = 4;

 

  ngOnInit(): void { }

  loadMore(): void {
    this.visibleFaqs += 4;
  }

  goToDocumentation(): void {
    window.open('/documentation', '_blank');
  }

  isPopupOpen = false;

  openPopup() {
    this.isPopupOpen = true;
  }

  closePopup() {
    this.isPopupOpen = false;
  }
  // Document for resource
  downloadDocument() {
    const link = document.createElement('a');
    link.href = 'path/to/your/document.pdf';
    link.download = 'Training_Resource_Document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  goToFaq(): void {
    this.router.navigate(['/faq']);
  }
}
