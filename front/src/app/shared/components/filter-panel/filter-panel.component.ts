import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="filter-panel card mb-4">
      <div
        class="filter-panel-header"
        role="button"
        [attr.aria-expanded]="expanded"
        (click)="expanded = !expanded"
      >
        <span><i class="bi bi-funnel me-2"></i>{{ title }}</span>
        <i class="bi" [class.bi-chevron-up]="expanded" [class.bi-chevron-down]="!expanded"></i>
      </div>
      @if (expanded) {
        <div class="filter-panel-body">
          <ng-content />
        </div>
      }
    </div>
  `,
})
export class FilterPanelComponent {
  @Input() title = 'Filtres';
  @Input() expanded = true;
}
