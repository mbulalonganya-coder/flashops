import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge status-badge" [ngClass]="badgeClass">{{ label }}</span>
  `,
})
export class StatusBadgeComponent {
  @Input({ required: true }) label!: string;
  @Input() success = false;

  get badgeClass(): string {
    if (this.success) return 'text-bg-success-subtle';
    const lower = this.label.toLowerCase();
    if (lower.includes('fail') || lower.includes('error') || lower.includes('reject')) {
      return 'text-bg-danger-subtle';
    }
    if (lower.includes('pending') || lower.includes('wait')) {
      return 'text-bg-warning-subtle';
    }
    return 'text-bg-secondary-subtle';
  }
}
