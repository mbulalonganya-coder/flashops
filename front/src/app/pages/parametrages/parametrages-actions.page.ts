import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UserActionDetail, UserActionSummary } from '../../core/models/api.models';
import { AdminService } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';
import { SectionCardComponent } from '../../shared/components/section-card/section-card.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { ActionDetailModalComponent } from './components/action-detail-modal.component';
import { TableActionsMenuComponent } from './components/table-actions-menu.component';

@Component({
  selector: 'app-parametrages-actions',
  standalone: true,
  imports: [CommonModule, SectionCardComponent, SkeletonComponent, TableActionsMenuComponent, ActionDetailModalComponent],
  template: `
    <app-section-card title="Registre des actions utilisateur" [noPadding]="true">
      @if (loading()) {
        <app-skeleton type="table" [rows]="8" [cols]="5" />
      } @else {
        <div class="parametrages-table-scroll">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>Module</th>
                <th class="text-end" style="width: 3.5rem"></th>
              </tr>
            </thead>
            <tbody>
              @for (row of items(); track row.id) {
                <tr>
                  <td class="text-muted small">{{ row.created_at | date: 'dd/MM/yyyy HH:mm:ss' }}</td>
                  <td>
                    @if (row.user) {
                      <span class="d-block">{{ row.user.full_name }}</span>
                      <small class="text-muted">{{ row.user.email }}</small>
                    } @else {
                      <span class="text-muted">—</span>
                    }
                  </td>
                  <td>
                    <span class="d-block">{{ row.label }}</span>
                    <code class="small text-muted">{{ row.action_code }}</code>
                  </td>
                  <td class="text-muted">{{ row.module || '—' }}</td>
                  <td class="text-end">
                    <app-table-actions-menu #rowMenu>
                      <button type="button" class="table-actions-menu__item" (click)="openDetail(row); rowMenu.close()">
                        <i class="bi bi-eye"></i>
                        Voir le détail
                      </button>
                    </app-table-actions-menu>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="text-center text-muted py-4">Aucune action enregistrée</td></tr>
              }
            </tbody>
          </table>
        </div>
        <div class="parametrages-table-footer d-flex justify-content-between align-items-center p-3 border-top">
          <span class="small text-muted">{{ total() }} action(s)</span>
          <div class="btn-group btn-group-sm">
            <button type="button" class="btn btn-outline-secondary" [disabled]="page() <= 0 || loading()" (click)="goPage(page() - 1)">
              Précédent
            </button>
            <button type="button" class="btn btn-outline-secondary" [disabled]="!hasNext() || loading()" (click)="goPage(page() + 1)">
              Suivant
            </button>
          </div>
        </div>
      }
    </app-section-card>

    <app-action-detail-modal [open]="detailOpen()" [action]="detail()" (close)="closeDetail()" />
  `,
})
export class ParametragesActionsPageComponent {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly items = signal<UserActionSummary[]>([]);
  readonly page = signal(0);
  readonly pageSize = signal(25);
  readonly total = signal(0);
  readonly detailOpen = signal(false);
  readonly detail = signal<UserActionDetail | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  hasNext(): boolean {
    return (this.page() + 1) * this.pageSize() < this.total();
  }

  goPage(next: number): void {
    this.page.set(Math.max(0, next));
    void this.load();
  }

  async openDetail(row: UserActionSummary): Promise<void> {
    try {
      const res = await firstValueFrom(this.admin.getAction(row.id));
      this.detail.set(res.data);
      this.detailOpen.set(true);
    } catch {
      this.toast.error('Détail indisponible');
    }
  }

  closeDetail(): void {
    this.detailOpen.set(false);
    this.detail.set(null);
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.admin.listActions(this.page(), this.pageSize()));
      this.items.set(res.data.items);
      this.total.set(res.data.total);
    } catch {
      this.toast.error('Chargement du journal impossible');
    } finally {
      this.loading.set(false);
    }
  }
}
