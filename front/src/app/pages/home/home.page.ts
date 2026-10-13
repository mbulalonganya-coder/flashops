import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  template: `
    <app-page-header title="Flash OPS" [subtitle]="'Connecté en tant que ' + (auth.user()?.full_name || auth.user()?.email)" />
    <div class="section-card p-4">
      <p class="mb-2">Module authentification opérationnel.</p>
      <p class="text-muted mb-0">Les autres modules (transactions, reporting, etc.) seront branchés progressivement.</p>
    </div>
  `,
})
export class HomePageComponent {
  readonly auth = inject(AuthService);
}
