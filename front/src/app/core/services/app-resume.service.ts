import { DestroyRef, Injectable, inject } from '@angular/core';
import { AppLoadingService } from './app-loading.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AppResumeService {
  private readonly loading = inject(AppLoadingService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private hiddenAt: number | null = null;
  private readonly idleMs = 45_000;

  init(): void {
    const onVisibility = (): void => {
      if (document.visibilityState === 'hidden') {
        this.hiddenAt = Date.now();
        return;
      }
      if (document.visibilityState !== 'visible') return;

      const idle =
        this.hiddenAt !== null && Date.now() - this.hiddenAt >= this.idleMs;
      this.hiddenAt = null;

      if (!idle || !this.auth.accessToken) return;

      void this.loading.run(
        () => this.auth.initSession(),
        'Reprise de la session…'
      );
    };

    document.addEventListener('visibilitychange', onVisibility);
    this.destroyRef.onDestroy(() =>
      document.removeEventListener('visibilitychange', onVisibility)
    );
  }
}
