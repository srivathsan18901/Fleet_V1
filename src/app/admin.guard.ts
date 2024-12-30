import { Location } from '@angular/common'
import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { CookieService } from "ngx-cookie-service";
 
@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  cookieValue: any;
  Location: any;
 
  constructor(private router: Router, private cookieService: CookieService, private location:Location) {
    try {
      this.cookieValue = JSON.parse(this.cookieService.get("_user"));
    } catch (error) {
      console.error("Error parsing cookie:", error);
      this.cookieValue = null;
    }
  }
 
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.cookieValue?.role === "Administrator" || this.cookieValue?.role === "Maintainer" || this.cookieValue?.role === "User") { // for temp..
      return true;
    } else {
      // this.router.navigateByUrl("")
      return false;
    }
  }
}
 
 