import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="app-shell" [class.sidebar-open]="mobileOpen()" [class.sidebar-collapsed]="collapsed()">
      @if (mobileOpen()) {
        <div class="sidebar-backdrop d-lg-none" (click)="mobileOpen.set(false)"></div>
      }

      <app-sidebar
        [collapsed]="collapsed()"
        (navigate)="mobileOpen.set(false)"
      />

      <div class="app-main">
        <app-header
          (toggleSidebar)="toggleMobileSidebar()"
          (toggleCollapse)="toggleSidebarCollapse()"
        />
        <main class="app-content container-fluid">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class MainLayoutComponent {
  readonly mobileOpen = signal(false);
  readonly collapsed = signal(false);

  toggleMobileSidebar(): void {
    this.mobileOpen.update((v) => !v);
  }

  toggleSidebarCollapse(): void {
    this.collapsed.update((v) => !v);
  }
}
