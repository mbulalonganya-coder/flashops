import { Component, inject } from '@angular/core';
import { AppLoadingService } from '../../../core/services/app-loading.service';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  template: `
    @if (loading.visible()) {
      <div class="global-loader" role="status" aria-live="polite" aria-busy="true">
        <img
          class="global-loader__logo flash-brand-pulse brand-logo--light"
          src="branding/logo-light1.png"
          width="120"
          height="120"
          alt=""
        />
        <img
          class="global-loader__logo flash-brand-pulse brand-logo--dark"
          src="branding/logo-dark1.png"
          width="120"
          height="120"
          alt=""
        />
        <p class="global-loader__text">{{ loading.message() }}</p>
      </div>
    }
  `,
  styles: `
    .global-loader {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      background: var(--app-bg, #f1f3f5);
      color: var(--text-muted, #6b7280);
    }

    .global-loader__logo {
      width: var(--logo-splash, 7.5rem);
      height: var(--logo-splash, 7.5rem);
      object-fit: contain;
    }

    .global-loader__text {
      margin: 0;
      font-size: var(--font-size-body, 1.0625rem);
      font-weight: 500;
      letter-spacing: var(--letter-spacing-body, -0.022em);
    }
  `,
})
export class GlobalLoaderComponent {
  readonly loading = inject(AppLoadingService);
}
