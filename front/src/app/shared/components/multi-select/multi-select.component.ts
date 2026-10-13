import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface MultiSelectOption {
  id: number;
  label: string;
}

@Component({
  selector: 'app-multi-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="multi-select position-relative">
      <button
        type="button"
        class="form-control multi-select-control text-start"
        (click)="togglePanel(); $event.stopPropagation()"
      >
        <span class="multi-select-value">
          @if (!selectedIds.length) {
            <span class="text-muted">{{ placeholder }}</span>
          } @else {
            @for (option of selectedOptions(); track option.id) {
              <span class="selected-chip">
                {{ option.label }}
                <span
                  role="button"
                  tabindex="0"
                  class="chip-remove"
                  (click)="$event.stopPropagation(); remove(option.id)"
                  (keydown.enter)="$event.stopPropagation(); remove(option.id)"
                >
                  <i class="bi bi-x"></i>
                </span>
              </span>
            }
          }
        </span>
        <i class="bi bi-chevron-down multi-select-chevron"></i>
      </button>

      @if (panelOpen) {
        <div class="multi-select-panel shadow-sm" (mousedown)="$event.preventDefault()">
          <div class="p-2 border-bottom">
            <div class="position-relative">
              <i class="bi bi-search search-icon"></i>
              <input
                type="text"
                class="form-control form-control-sm search-input"
                placeholder="Rechercher…"
                [(ngModel)]="query"
                (keydown.escape)="close()"
                autofocus
              />
            </div>
          </div>

          <div class="options-list">
            @for (option of filteredOptions(); track option.id) {
              <button
                type="button"
                class="option-item"
                [class.selected]="isSelected(option.id)"
                (mousedown)="$event.preventDefault(); toggle(option.id)"
              >
                <span>{{ option.label }}</span>
                @if (isSelected(option.id)) {
                  <i class="bi bi-check-lg"></i>
                }
              </button>
            } @empty {
              <div class="p-3 text-muted small">Aucun résultat</div>
            }
          </div>

          @if (selectedIds.length) {
            <div class="p-2 border-top">
              <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none" (mousedown)="$event.preventDefault(); clear()">
                Effacer la sélection
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .multi-select-control {
      min-height: var(--flash-control-height, 34px);
      height: auto;
      padding: 0.22rem 2rem 0.22rem 0.45rem;
      background: var(--card-bg, #fff);
      position: relative;
    }
    .multi-select-value {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      align-items: center;
    }
    .selected-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.15rem;
      max-width: 100%;
      padding: 0.08rem 0.3rem;
      border-radius: 0.3rem;
      background: rgba(255, 213, 0, 0.22);
      font-size: 0.78rem;
      line-height: 1.15rem;
    }
    .chip-remove {
      display: inline-flex;
      font-size: 1rem;
      color: var(--text-muted, #6b7280);
    }
    .multi-select-chevron {
      position: absolute;
      right: 0.65rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.75rem;
      color: var(--text-muted, #6b7280);
    }
    .multi-select-panel {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      z-index: 1050;
      overflow: hidden;
      border: 1px solid var(--card-border, #e5e7eb);
      border-radius: 0.5rem;
      background: var(--card-bg, #fff);
    }
    .search-icon {
      position: absolute;
      left: 0.6rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted, #6b7280);
      pointer-events: none;
    }
    .search-input {
      padding-left: 1.9rem;
    }
    .options-list {
      max-height: 240px;
      overflow-y: auto;
      padding: 0.25rem;
    }
    .option-item {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.32rem 0.55rem;
      border: 0;
      border-radius: 0.35rem;
      background: transparent;
      color: inherit;
      text-align: left;
      font-size: 0.875rem;
    }
    .option-item:hover,
    .option-item.selected {
      background: rgba(255, 213, 0, 0.16);
    }
  `,
})
export class MultiSelectComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  @Input() options: MultiSelectOption[] = [];
  @Input() selectedIds: number[] = [];
  @Input() placeholder = 'Toutes';
  @Output() selectedIdsChange = new EventEmitter<number[]>();

  panelOpen = false;
  query = '';

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.panelOpen) return;
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onDocumentEscape(): void {
    if (this.panelOpen) this.close();
  }

  togglePanel(): void {
    this.panelOpen = !this.panelOpen;
    if (!this.panelOpen) this.query = '';
  }

  close(): void {
    this.panelOpen = false;
    this.query = '';
  }

  filteredOptions(): MultiSelectOption[] {
    const term = this.query.trim().toLocaleLowerCase('fr');
    if (!term) return this.options;
    return this.options.filter((option) => option.label.toLocaleLowerCase('fr').includes(term));
  }

  selectedOptions(): MultiSelectOption[] {
    return this.options.filter((option) => this.isSelected(option.id));
  }

  isSelected(id: number): boolean {
    return this.selectedIds.includes(id);
  }

  toggle(id: number): void {
    const next = this.isSelected(id)
      ? this.selectedIds.filter((selectedId) => selectedId !== id)
      : [...this.selectedIds, id];
    this.selectedIdsChange.emit(next);
  }

  remove(id: number): void {
    this.selectedIdsChange.emit(this.selectedIds.filter((selectedId) => selectedId !== id));
  }

  clear(): void {
    this.selectedIdsChange.emit([]);
  }
}
