import { Component } from '@angular/core';
import { fadeAnimation } from './app.animations';
import { Router } from '@angular/router';
import { LoaderService } from './loader.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [fadeAnimation]
})
export class AppComponent {
  title = 'FleetUI';
  getRouteAnimationData(outlet: any) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData.animation;
  }



  constructor(private loaderService: LoaderService, public router: Router) {}
  shouldShowSidebar(): boolean {
    // Add the routes where you want to hide the sidebar
    const excludedRoutes = ['/login', '/project_setup']; // Add other routes if needed
    return !excludedRoutes.includes(this.router.url);
  }
  ngOnInit(): void {
    window.scroll(0,0);
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = () => {
      window.history.go(1)
    };
  }

  public getRouter(): Router {
    return this.router;
  }

isSidebarHidden(): boolean {
  const url = this.router.url;
  return url === '/' || url.startsWith('/project_setup');
}

}
