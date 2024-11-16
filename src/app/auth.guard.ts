import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { LoaderService } from './loader.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router, private loaderService: LoaderService) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const url: string = state.url;
    return this.checkLogin(url);

    this.loaderService.show();
    
    // Simulate a delay for demonstration
    setTimeout(() => {
      this.loaderService.hide();
    }, 2000); // Replace with actual logic

    return true; // or false based on your authentication logic
  }

  checkLogin(url: string): boolean {
    if (this.authService.isLoggedIn()) {
      if (url === '/') {
        this.router.navigate(['/project_setup']);
        return false;
      }
      return true;
    }

    if (url !== '/') {
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }


}
