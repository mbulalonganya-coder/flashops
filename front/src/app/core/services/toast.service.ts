import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'danger' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  title?: string;
  durationMs: number;
  leaving: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  readonly toasts = signal<Toast[]>([]);

  show(message: string, type: ToastType = 'info', durationMs = 4500, title?: string): void {
    const id = ++this.nextId;
    this.toasts.update((list) => [
      ...list,
      {
        id,
        type,
        message,
        title: title ?? this.defaultTitle(type),
        durationMs,
        leaving: false,
      },
    ]);
    this.timers.set(
      id,
      setTimeout(() => this.dismiss(id), durationMs)
    );
  }

  success(message: string, title?: string): void {
    this.show(message, 'success', 4500, title);
  }

  error(message: string, title?: string): void {
    this.show(message, 'danger', 6500, title);
  }

  warning(message: string, title?: string): void {
    this.show(message, 'warning', 5500, title);
  }

  info(message: string, title?: string): void {
    this.show(message, 'info', 4500, title);
  }

  dismiss(id: number): void {
    const existing = this.timers.get(id);
    if (existing) {
      clearTimeout(existing);
      this.timers.delete(id);
    }

    const toast = this.toasts().find((item) => item.id === id);
    if (!toast || toast.leaving) return;

    this.toasts.update((list) =>
      list.map((item) => (item.id === id ? { ...item, leaving: true } : item))
    );

    setTimeout(() => {
      this.toasts.update((list) => list.filter((item) => item.id !== id));
    }, 280);
  }

  private defaultTitle(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'Succès';
      case 'danger':
        return 'Erreur';
      case 'warning':
        return 'Attention';
      default:
        return 'Information';
    }
  }
}
