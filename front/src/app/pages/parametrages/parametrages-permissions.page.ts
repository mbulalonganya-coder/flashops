import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Permission } from '../../core/models/api.models';
import { AdminService } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';
import { SectionCardComponent } from '../../shared/components/section-card/section-card.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-parametrages-permissions',
  standalone: true,
  imports: [CommonModule, SectionCardComponent, SkeletonComponent],
  template: `
    <app-section-card title="Registre des permissions" [noPadding]="true">
      @if (loading()) {
        <app-skeleton type="table" [rows]="8" [cols]="3" />
      } @else {
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Code</th>
                <th>Libellé</th>
                <th>Module</th>
              </tr>
            </thead>
            <tbody>
              @for (perm of permissions(); track perm.id) {
                <tr>
                  <td><code>{{ perm.code }}</code></td>
                  <td>{{ perm.label }}</td>
                  <td class="text-muted">{{ perm.module }}</td>
                </tr>
              } @empty {
                <tr><td colspan="3" class="text-center text-muted py-4">Aucune permission</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </app-section-card>
  `,
})
export class ParametragesPermissionsPageComponent {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly permissions = signal<Permission[]>([]);

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.admin.listPermissions());
      this.permissions.set(res.data);
    } catch {
      this.toast.error('Chargement des permissions impossible');
    } finally {
      this.loading.set(false);
    }
  }
}
