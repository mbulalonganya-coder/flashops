import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.accessToken && !auth.refreshToken) {
    if (auth.isAuthenticated()) auth.logout();
    return router.createUrlTree(['/login']);
  }

  if (auth.isAuthenticated() && auth.accessToken) return true;

  await auth.initSession();
  if (auth.isAuthenticated() && auth.accessToken) return true;

  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? router.createUrlTree(['/']) : true;
};

export const permissionGuard = (permission: string): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.can(permission) ? true : router.createUrlTree(['/']);
};

export const permissionAnyGuard = (...permissions: string[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.canAny(...permissions) ? true : router.createUrlTree(['/']);
};
