import { Component, ElementRef, ViewChild, effect, inject } from '@angular/core';
import type { AnimationItem } from 'lottie-web';
import { AppLoadingService } from '../../../core/services/app-loading.service';
import { BRANDING } from '../../../core/constants/branding';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  template: `
    @if (loading.visible()) {
      <div class="global-loader" role="status" aria-live="polite" aria-busy="true">
        <div #lottieHost class="global-loader__lottie"></div>
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

    .global-loader__lottie {
      width: min(220px, 55vw);
      height: min(220px, 55vw);
    }

    .global-loader__text {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 500;
    }
  `,
})
export class GlobalLoaderComponent {
  readonly loading = inject(AppLoadingService);

  @ViewChild('lottieHost') private lottieHost?: ElementRef<HTMLDivElement>;

  private animation: AnimationItem | null = null;

  constructor() {
    effect(() => {
      if (this.loading.visible()) {
        setTimeout(() => void this.ensureAnimation(), 0);
      } else {
        this.destroyAnimation();
      }
    });
  }

  private async ensureAnimation(): Promise<void> {
    if (!this.lottieHost?.nativeElement || this.animation) {
      return;
    }
    const host = this.lottieHost.nativeElement;
    host.innerHTML = '';
    const lottie = await import('lottie-web');
    this.animation = lottie.default.loadAnimation({
      container: host,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: BRANDING.loaderLottie,
    });
  }

  private destroyAnimation(): void {
    this.animation?.destroy();
    this.animation = null;
    this.lottieHost?.nativeElement?.replaceChildren();
  }
}
