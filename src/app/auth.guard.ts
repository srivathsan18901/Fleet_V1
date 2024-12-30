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
  constructor(
    private authService: AuthService,
    private router: Router,
    private loaderService: LoaderService
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const url: string = state.url;

    // Show loader
    this.loaderService.show();

    // Check login status
    const isLoggedIn = this.checkLogin(url);

    // Hide loader
    this.loaderService.hide();

    return isLoggedIn;
  }

  private checkLogin(url: string): boolean {
    if (this.authService.isLoggedIn()) {
      // Redirect to /project_setup if logged in and accessing root
      if (url === '/') {
        this.router.navigate(['/project_setup']);
        return false;
      }
      return true;
    }

    // Redirect to login page if not logged in
    if (url !== '/') {
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }
}
