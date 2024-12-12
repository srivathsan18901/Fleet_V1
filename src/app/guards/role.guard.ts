// import { Injectable } from '@angular/core';
// import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
// import { Observable } from 'rxjs';
// import { UserPermissionService } from '../services/user-permission.service';

// @Injectable({
//   providedIn: 'root',
// })
// export class RoleGuard implements CanActivate {
//   constructor(private userPermissionService: UserPermissionService, private router: Router) {}

//   canActivate(
//     route: ActivatedRouteSnapshot,
//     state: RouterStateSnapshot
//   ): Observable<boolean> | Promise<boolean> | boolean {
//     const requiredPermissions = route.data['permissions']; // Permissions required for the route
//     const userPermissions = this.userPermissionService.getPermissions(); // Get user permissions from the service

//     if (!userPermissions) {
//       // If permissions are not yet loaded, redirect to login or error page
//       this.router.navigate(['/']);
//       return false;
//     }

//     // Check if the user has all the required permissions
//     const hasAccess = requiredPermissions.every((perm: string) => userPermissions[perm]);
//     if (!hasAccess) {
//       // Redirect to a "Not Authorized" or Dashboard page if access is denied
//       this.router.navigate(['/dashboard']);
//     }
//     return hasAccess;
//   }
// }
