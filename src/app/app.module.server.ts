import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { MessageService } from 'primeng/api';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router'; // Add this
@NgModule({
  imports: [
    // AppModule,
    ServerModule,
    BrowserModule,
    RouterModule
  ],
  bootstrap: [AppComponent],
  providers: [
    MessageService,
  ]
})
export class AppServerModule {}
