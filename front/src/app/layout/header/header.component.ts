import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="app-header">
      <div class="header-start">
        <button type="button" class="btn btn-icon d-lg-none" (click)="toggleSidebar.emit()" aria-label="Menu">
          <i class="bi bi-list"></i>
        </button>
        <button type="button" class="btn btn-icon d-none d-lg-inline-flex" (click)="toggleCollapse.emit()" aria-label="Réduire">
          <i class="bi bi-layout-sidebar-inset"></i>
        </button>
      </div>

      <div class="header-end">
        <button type="button" class="btn btn-icon" (click)="theme.toggle()" [title]="theme.mode() === 'light' ? 'Mode sombre' : 'Mode clair'">
          <i class="bi" [class.bi-moon-stars]="theme.mode() === 'light'" [class.bi-sun]="theme.mode() === 'dark'"></i>
        </button>

        @if (auth.user(); as user) {
          <div class="dropdown">
            <button class="btn user-menu" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <span class="user-avatar">{{ initials(user.full_name) }}</span>
              <span class="d-none d-md-inline user-info">
                <strong>{{ user.full_name }}</strong>
                <small>{{ user.role.code }}</small>
              </span>
              <i class="bi bi-chevron-down ms-1"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow">
              <li><span class="dropdown-item-text text-muted small">{{ user.email }}</span></li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <button class="dropdown-item text-danger" type="button" (click)="auth.logout()">
                  <i class="bi bi-box-arrow-right me-2"></i>Déconnexion
                </button>
              </li>
            </ul>
          </div>
        }
      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleCollapse = new EventEmitter<void>();

  initials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }
}
