import { Component } from '@angular/core';
import { TranslationService } from '../../../services/translation.service';

@Component({
  selector: 'app-robot',
  templateUrl: './robot.component.html',
  styleUrl: './robot.component.css'
})
export class RobotComponent {
  constructor(
    private translationService: TranslationService,
  ){
    
  }
  getTranslation(key: string) {
    return this.translationService.getEnvmapTranslation(key);
  }
}
