import { Component } from '@angular/core';
import { Router } from '@angular/router'; // Import Router
import { environment } from '../../environments/environment.development';
import { ProjectService } from '../services/project.service';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrl: './support.component.css',
})
export class SupportComponent {
  showPopup = false;

  // Sample questions and answers
  questions = [
    {
      question: 'Is there a free trial available?',
      answer:
        'Yes, you can try us for free for 30 days. If you want, we’ll provide you with a free 30-minute onboarding call to get you up and running.',
      showAnswer: false,
    },
    {
      question: 'What is your cancellation policy?',
      answer:
        'We understand that things change. You can cancel your plan at any time and we’ll refund you the difference already paid.',
      showAnswer: false,
    },
    {
      question: 'How does billing work?',
      answer:
        'Plans are per workspace, not per account. You can upgrade one workspace, and still have any number of free workspaces.',
      showAnswer: false,
    },
    {
      question: 'How does support work?',
      answer:
        'If you’re having trouble, we’re here to help via email. We’re a small team but will get back to you soon.',
      showAnswer: false,
    },
    {
      question: 'Can I change my plan later?',
      answer:
        'Of course you can! Our pricing scales with your company. Chat with our friendly team to find a solution that works for you as you grow.',
      showAnswer: false,
    },
    {
      question: 'Can other info be added to an invoice?',
      answer:
        'At the moment, the only way to add additional information to invoices is to add it to the workspace’s name manually.',
      showAnswer: false,
    },
    {
      question: 'How do I change my account email?',
      answer:
        'You can change the email address associated with your account by going to your account settings on a laptop or desktop.',
      showAnswer: false,
    },
    {
      question: 'Do you provide tutorials?',
      answer:
        'Not yet, but we’re working on it! We’ve done our best to make it intuitive and are building out the documentation.',
      showAnswer: false,
    },
  ];

  selectedProject: any | null = null;
  leftQuestions = this.questions.slice(0, 4);
  rightQuestions = this.questions.slice(4);

  constructor(private projectService: ProjectService) {}

  ngOnInit() {
    this.selectedProject = this.projectService.getSelectedProject();
  }

  toggleAnswer(selectedQuestion: any) {
    // Close all questions first
    this.leftQuestions.forEach((question) => {
      if (question !== selectedQuestion) {
        question.showAnswer = false;
      }
    });
    this.rightQuestions.forEach((question) => {
      if (question !== selectedQuestion) {
        question.showAnswer = false;
      }
    });

    // Toggle the selected question
    selectedQuestion.showAnswer = !selectedQuestion.showAnswer;
  }

  goToFaq() {
    this.showPopup = true; // Show the popup
  }

  closePopup() {
    this.showPopup = false; // Hide the popup
  }

  async exportProject() {
    if (!this.selectedProject) return;
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/fleet-project-file/download-project/${this.selectedProject.projectName}`,
      {
        credentials: 'include',
      }
    );
    if (!response.ok) alert('try once again');
    else {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${this.selectedProject.projectName}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  }

  goToDocumentation(): void {
    window.open('/documentation', '_blank');
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
}
