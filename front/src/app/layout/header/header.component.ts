import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { User } from '../../core/models/api.models';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, UserAvatarComponent],
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
        <button
          type="button"
          class="btn btn-icon"
          (click)="theme.toggle()"
          [title]="theme.mode() === 'light' ? 'Mode sombre' : 'Mode clair'"
        >
          <i class="bi" [class.bi-moon-stars]="theme.mode() === 'light'" [class.bi-sun]="theme.mode() === 'dark'"></i>
        </button>

        @if (auth.user(); as user) {
          <div class="header-user-dropdown" [class.is-open]="menuOpen()">
            <button
              type="button"
              class="btn user-menu"
              (click)="toggleMenu($event)"
              [attr.aria-expanded]="menuOpen()"
              aria-haspopup="menu"
            >
              <app-user-avatar [user]="user" size="sm" />
              <span class="d-none d-md-flex user-info">
                <span class="user-display-name">{{ displayName(user) }}</span>
                <span class="user-role-badge">{{ user.role.code }}</span>
              </span>
              <i class="bi bi-chevron-down user-menu-chevron" [class.is-open]="menuOpen()"></i>
            </button>

            @if (menuOpen()) {
              <ul class="user-dropdown-menu shadow" role="menu">
                <li class="user-dropdown-menu__head" role="none">
                  <span class="user-dropdown-menu__name">{{ displayName(user) }}</span>
                  <span class="user-dropdown-menu__email">{{ user.email }}</span>
                </li>
                <li role="none"><hr class="dropdown-divider my-1" /></li>
                <li role="none">
                  <a class="user-dropdown-item" routerLink="/profil" role="menuitem" (click)="closeMenu()">
                    <i class="bi bi-person-circle"></i>
                    Mon profil
                  </a>
                </li>
                <li role="none">
                  <button type="button" class="user-dropdown-item is-danger" role="menuitem" (click)="logout()">
                    <i class="bi bi-box-arrow-right"></i>
                    Déconnexion
                  </button>
                </li>
              </ul>
            }
          </div>
        }
      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly host = inject(ElementRef<HTMLElement>);

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleCollapse = new EventEmitter<void>();

  readonly menuOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuOpen.set(false);
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.closeMenu();
    this.auth.logout();
  }

  displayName(user: User): string {
    return user.full_name?.trim() || user.email;
  }

  initials(user: User): string {
    const source = this.displayName(user);
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }
}
