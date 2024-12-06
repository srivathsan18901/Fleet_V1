import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { Observable, endWith } from 'rxjs';
import { ProjectService } from '../services/project.service';
import { UserPermissionService } from '../services/user-permission.service';


@Injectable({
  providedIn: 'root',
})
export class ProjectGuard implements CanActivate {
  constructor(private projectService: ProjectService, private router: Router, private userPermissionService: UserPermissionService) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const url: string = state.url;
    return this.checkProjectExist(url);
    // return this.checkProjectExist(url) && this.checkPermissions(url)
  }

  checkProjectExist(url: string): boolean {
    const isCreated = this.projectService.isProjectCreated();

    if (isCreated) {
      if (url === '/project_setup') {
        this.router.navigate(['/dashboard']);
        return false;
      }
      return true;
    }
    if (url !== '/project_setup') {
      this.router.navigate(['/project_setup']);
      return false;
    }
    return true;
  }

  checkPermissions(url: string): boolean{
    let {generalPermissions} = this.userPermissionService.getPermissions()
    if(url==='/dashboard' && generalPermissions.dashboard) {
      this.router.navigate([url])
      return true;
    }
    if(url==='/statistics' && generalPermissions.statistics)  {
      this.router.navigate([url])
      return true;
    }
    if(url==='/robots' && generalPermissions.robots)  {
      this.router.navigate([url])
      return true;
    }
    if(url==='/tasks' && generalPermissions.tasks)  {
      this.router.navigate([url])
      return true;
    }
    if(url==='/Reports')  {
      // this.router.navigate([url])
      this.router.navigate([url])
      return false;
    }
    // if(url==='/usermanagement' && generalPermissions.userManagement)  {
    //   // this.router.navigate([url])
    //   return true;
    // }
    this.router.navigate(['/dashboard'])
    return false
  }
}
