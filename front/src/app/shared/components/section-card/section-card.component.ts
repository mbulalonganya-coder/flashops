import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-section-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="section-card mb-4">
      @if (title || subtitle) {
        <header class="section-card-header" [class.section-card-header--stacked]="stackedHeader">
          <div class="section-card-heading">
            @if (title) {
              <h2 class="section-card-title">{{ title }}</h2>
            }
            @if (subtitle) {
              <p class="section-card-subtitle">{{ subtitle }}</p>
            }
          </div>
          <div class="section-card-actions">
            <ng-content select="[actions]" />
          </div>
        </header>
      }
      <div class="section-card-body" [class.p-0]="noPadding">
        <ng-content />
      </div>
    </section>
  `,
})
export class SectionCardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() noPadding = false;
  /** Place actions under the title instead of beside it (better for narrow cards). */
  @Input() stackedHeader = false;
}
