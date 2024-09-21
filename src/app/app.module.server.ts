import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { MessageService } from 'primeng/api';

@NgModule({
  imports: [
    // AppModule,
    ServerModule,
  ],
  bootstrap: [AppComponent],
  providers: [
    MessageService,
  ]
})
export class AppServerModule {}
