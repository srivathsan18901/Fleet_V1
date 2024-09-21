import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private maps: Array<{ column1: string, column2: string, column3: string }> = [];

  constructor(private cookieService : CookieService) {}

  setOnCreateMapImg(imgUrl : string){
    this.cookieService.set('temp-mapImg', imgUrl);
  }
}
