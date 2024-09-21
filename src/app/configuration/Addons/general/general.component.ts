import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
interface DB {
  name: string;
  code: string;
}

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrl: './general.component.css'
})
export class GeneralComponent {

  dtype: DB[] | undefined;
  iptype: DB[] | undefined;

    selectedDb: DB | undefined;

    ngOnInit() {
        this.dtype = [
            { name: 'PostgreSQL', code: 'NY' },
            { name: 'MongoDB', code: 'RM' },
            { name: 'SQL', code: 'LDN' },
        ];
        this.iptype = [
          { name: 'PostgreSQL', code: 'NY' },
          { name: 'MongoDB', code: 'RM' },
          { name: 'SQL', code: 'LDN' },
      ];
    }

}
