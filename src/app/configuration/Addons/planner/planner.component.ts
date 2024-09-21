import { Component } from '@angular/core';

interface DB {
  name: string;
  code: string;
}
@Component({
  selector: 'app-planner',
  templateUrl: './planner.component.html',
  styleUrl: './planner.component.css'
})
export class PlannerComponent {

  dtype: DB[] | undefined;
  selectedDb: DB | undefined;

  ngOnInit() {
    this.dtype = [
        { name: 'ASipp', code: 'ASipp' },
        { name: 'NodeGraph', code: 'NodeGraph' },
    ];
  }
}
