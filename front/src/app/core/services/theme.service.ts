import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'flashops-theme';
  readonly mode = signal<ThemeMode>(this.load());

  constructor() {
    effect(() => this.apply(this.mode()));
  }

  toggle(): void {
    this.mode.update((m) => (m === 'light' ? 'dark' : 'light'));
  }

  set(mode: ThemeMode): void {
    this.mode.set(mode);
  }

  private load(): ThemeMode {
    const stored = localStorage.getItem(this.storageKey);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private apply(mode: ThemeMode): void {
    document.documentElement.setAttribute('data-bs-theme', mode);
    document.body.classList.toggle('theme-dark', mode === 'dark');
    localStorage.setItem(this.storageKey, mode);
  }
}
