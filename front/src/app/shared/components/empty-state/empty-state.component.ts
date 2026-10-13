import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state text-center py-5">
      <i [class]="icon + ' empty-state-icon'"></i>
      <h3 class="empty-state-title">{{ title }}</h3>
      @if (message) {
        <p class="empty-state-message">{{ message }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() title = 'Aucune donnée';
  @Input() message = '';
  @Input() icon = 'bi bi-inbox';
}
