import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { RuntimeConfigService } from '../services/runtime-config.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);
  const runtime = inject(RuntimeConfigService);
  const token = auth.accessToken;
  const isAuthRoute = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');
  const isPublicRoute =
    req.url.includes('/config/public') || req.url.includes('/public/agencies/geo');

  const authedReq = token && !isAuthRoute
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isAuthRoute && !isPublicRoute && !req.headers.has('X-Retry')) {
        return from(auth.tryRefresh()).pipe(
          switchMap((newToken) => {
            if (!newToken) return throwError(() => err);
            const retry = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}`, 'X-Retry': '1' },
            });
            return next(retry);
          })
        );
      }

      if (isPublicRoute) {
        return throwError(() => err);
      }
      if (err.status === 403 && !isAuthRoute) {
        toast.warning('Accès refusé — permissions insuffisantes.');
      } else if (err.status === 429) {
        toast.warning('Trop de requêtes — réessayez dans quelques instants.');
      } else if (err.status === 502) {
        toast.error('API Flash OPS indisponible (bad gateway).');
      } else if (err.status === 0) {
        toast.error(
          `Impossible de joindre l'API (${runtime.apiUrl}). Démarrez le backend Spring Boot sur le port 8080.`
        );
      }

      return throwError(() => err);
    })
  );
};
