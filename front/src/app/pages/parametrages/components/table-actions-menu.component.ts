import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';

const PANEL_MIN_WIDTH = 168;
const PANEL_EST_HEIGHT = 48;
const VIEWPORT_MARGIN = 8;

let closeActiveMenu: (() => void) | null = null;

@Component({
  selector: 'app-table-actions-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-actions-menu" [class.is-open]="open()">
      <button
        type="button"
        class="btn btn-icon btn-sm table-actions-menu__toggle"
        (click)="toggle($event)"
        [attr.aria-expanded]="open()"
        aria-haspopup="true"
        aria-label="Actions"
      >
        <i class="bi bi-three-dots-vertical" aria-hidden="true"></i>
      </button>
    </div>

    @if (open()) {
      <div
        class="table-actions-menu__panel table-actions-menu__panel--fixed shadow-sm"
        role="menu"
        [style.top.px]="panelTop()"
        [style.left.px]="panelLeft()"
        (click)="$event.stopPropagation()"
      >
        <ng-content />
      </div>
    }
  `,
  styles: `
    .table-actions-menu {
      position: relative;
      display: inline-flex;
      justify-content: flex-end;
    }

    .table-actions-menu__toggle .bi-three-dots-vertical {
      font-size: 1.1rem;
      line-height: 1;
    }

    .table-actions-menu__panel--fixed {
      position: fixed;
      z-index: 1100;
      min-width: 10.5rem;
      padding: 0.35rem 0;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--flash-radius, 0.75rem);
      box-shadow: 0 8px 24px rgba(17, 17, 17, 0.14);
    }

    :host ::ng-deep .table-actions-menu__item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.45rem 0.85rem;
      border: 0;
      background: transparent;
      color: var(--text-primary);
      font-size: 0.875rem;
      text-align: left;
    }

    :host ::ng-deep .table-actions-menu__item:hover:not(:disabled) {
      background: var(--flash-gray-100);
    }

    :host ::ng-deep .table-actions-menu__item:disabled {
      opacity: 0.5;
    }
  `,
})
export class TableActionsMenuComponent {
  private readonly document = inject(DOCUMENT);

  readonly open = signal(false);
  readonly panelTop = signal(0);
  readonly panelLeft = signal(0);

  private readonly dismiss = (): void => {
    this.open.set(false);
    if (closeActiveMenu === this.dismiss) {
      closeActiveMenu = null;
    }
  };

  toggle(event: Event): void {
    event.stopPropagation();
    if (this.open()) {
      this.dismiss();
      return;
    }
    if (closeActiveMenu && closeActiveMenu !== this.dismiss) {
      closeActiveMenu();
    }
    const btn = event.currentTarget as HTMLElement | null;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const maxBottom = this.maxOpenBottom();
    const spaceBelow = maxBottom - rect.bottom;
    const openDown = spaceBelow >= PANEL_EST_HEIGHT + VIEWPORT_MARGIN;

    let top: number;
    if (openDown) {
      top = rect.bottom + 4;
    } else {
      top = rect.top - PANEL_EST_HEIGHT - 4;
    }
    top = Math.max(VIEWPORT_MARGIN, Math.min(top, maxBottom - PANEL_EST_HEIGHT - VIEWPORT_MARGIN));

    let left = rect.right - PANEL_MIN_WIDTH;
    left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - PANEL_MIN_WIDTH - VIEWPORT_MARGIN));

    this.panelTop.set(top);
    this.panelLeft.set(left);
    this.open.set(true);
    closeActiveMenu = this.dismiss;
  }

  close(): void {
    this.dismiss();
  }

  private maxOpenBottom(): number {
    const footers = this.document.querySelectorAll('.parametrages-table-footer');
    let limit = window.innerHeight - VIEWPORT_MARGIN;
    footers.forEach((el) => {
      const top = el.getBoundingClientRect().top;
      if (top > 0 && top < limit) {
        limit = top - 4;
      }
    });
    return limit;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.dismiss();
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange(): void {
    this.dismiss();
  }
}
