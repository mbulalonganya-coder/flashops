import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ReportQueryFilters, ReportRankingItem } from '../../../core/models/api.models';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { formatNumberFr, formatValeurFr } from '../../utils/format.utils';

export interface RankingAgenciesDrilldown {
  title: string;
  subtitle?: string;
  from: string;
  to: string;
  currency?: string;
  /** Extra report filters that scope the agency list (city, corridor, …). */
  filters: Partial<ReportQueryFilters>;
}

@Component({
  selector: 'app-ranking-agencies-modal',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent, SkeletonComponent],
  template: `
    @if (context) {
      <div
        class="modal fade show d-block ranking-agencies-modal"
        tabindex="-1"
        role="dialog"
        style="background: rgba(0,0,0,.45)"
        (click)="onBackdrop($event)"
      >
        <div class="modal-dialog modal-lg modal-dialog-scrollable" (click)="$event.stopPropagation()">
          <div class="modal-content">
            <div class="modal-header">
              <div class="pe-3">
                <h5 class="modal-title mb-0">{{ context.title }}</h5>
                @if (context.subtitle) {
                  <small class="text-muted">{{ context.subtitle }}</small>
                }
              </div>
              <button type="button" class="btn-close" aria-label="Fermer" (click)="closed.emit()"></button>
            </div>
            <div class="modal-body p-0">
              @if (loading()) {
                <div class="p-3"><app-skeleton type="table" [rows]="8" [cols]="4" /></div>
              } @else if (!rows().length) {
                <div class="p-3">
                  <app-empty-state
                    title="Aucune agence"
                    message="Pas d’agence avec du trafic pour ce périmètre sur la période."
                    icon="bi bi-building"
                  />
                </div>
              } @else {
                <div class="table-responsive">
                  <table class="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th style="width: 3rem">#</th>
                        <th>Agence</th>
                        <th class="text-end">Volume</th>
                        <th class="text-end">Valeur</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of rows(); track row.code; let i = $index) {
                        <tr
                          class="agency-pick-row"
                          role="button"
                          tabindex="0"
                          (click)="agencyPick.emit(row)"
                          (keydown.enter)="agencyPick.emit(row)"
                        >
                          <td>
                            <span class="rank-num">{{ rankNumber(i) }}</span>
                          </td>
                          <td>
                            <span class="d-block text-truncate fw-medium" style="max-width: 22rem">{{ row.label }}</span>
                            <small class="text-muted text-truncate d-block" style="max-width: 22rem">{{ row.code }}</small>
                          </td>
                          <td class="text-end text-nowrap">{{ formatNumberFr(row.tx_count) }}</td>
                          <td class="text-end text-nowrap">
                            {{ formatValeurFr(row.volume, row.currency || context.currency) }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
            @if (!loading() && total() > 0) {
              <div class="modal-footer justify-content-between flex-wrap gap-2">
                <small class="text-muted">{{ rangeLabel() }}</small>
                <div class="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm"
                    (click)="prevPage()"
                    [disabled]="page() <= 1 || loading()"
                  >
                    <i class="bi bi-chevron-left"></i>
                  </button>
                  <span class="small text-nowrap">{{ page() }} / {{ totalPages() }}</span>
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm"
                    (click)="nextPage()"
                    [disabled]="page() >= totalPages() || loading()"
                  >
                    <i class="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .ranking-agencies-modal {
        z-index: 1055;
      }
      .agency-pick-row {
        cursor: pointer;
      }
      .agency-pick-row:hover {
        background: rgba(0, 0, 0, 0.03);
      }
      .rank-num {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.6rem;
        height: 1.6rem;
        border-radius: 0.35rem;
        font-size: 0.75rem;
        font-weight: 600;
        background: #f1f3f5;
        color: #343a40;
      }
    `,
  ],
})
export class RankingAgenciesModalComponent implements OnChanges {
  private readonly api = inject(ApiService);

  @Input() context: RankingAgenciesDrilldown | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() agencyPick = new EventEmitter<ReportRankingItem>();

  readonly rows = signal<ReportRankingItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly loading = signal(false);
  readonly pageSize = 10;
  formatNumberFr = formatNumberFr;
  formatValeurFr = formatValeurFr;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['context']) {
      this.page.set(1);
      this.load();
    }
  }

  onBackdrop(ev: MouseEvent): void {
    if (ev.target === ev.currentTarget) {
      this.closed.emit();
    }
  }

  rankNumber(index: number): number {
    return (this.page() - 1) * this.pageSize + index + 1;
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.pageSize));
  }

  rangeLabel(): string {
    const total = this.total();
    if (!total) return 'Aucun résultat';
    const from = (this.page() - 1) * this.pageSize + 1;
    const to = Math.min(this.page() * this.pageSize, total);
    return `${from}–${to} sur ${formatNumberFr(total)} agences`;
  }

  prevPage(): void {
    if (this.page() <= 1) return;
    this.page.update((p) => p - 1);
    this.load();
  }

  nextPage(): void {
    if (this.page() >= this.totalPages()) return;
    this.page.update((p) => p + 1);
    this.load();
  }

  private load(): void {
    const ctx = this.context;
    if (!ctx) {
      this.rows.set([]);
      this.total.set(0);
      return;
    }
    this.loading.set(true);
    this.api
      .getReportRankings('agency', 'custom', 'volume', {
        from: ctx.from,
        to: ctx.to,
        currency: ctx.currency || ctx.filters.currency,
        city: ctx.filters.city,
        commune: ctx.filters.commune,
        province: ctx.filters.province,
        country: ctx.filters.country,
        sag_group_id: ctx.filters.sag_group_id,
        corridor: ctx.filters.corridor,
        product_ids: ctx.filters.product_ids,
        operation_id: ctx.filters.operation_id,
        category_id: ctx.filters.category_id,
        agency_id: ctx.filters.agency_id,
        agent_id: ctx.filters.agent_id,
        status: ctx.filters.status,
        sort: 'desc',
        page: this.page(),
        limit: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          this.rows.set(res.data ?? []);
          this.total.set(res.pagination?.total ?? res.data?.length ?? 0);
          this.loading.set(false);
        },
        error: () => {
          this.rows.set([]);
          this.total.set(0);
          this.loading.set(false);
        },
      });
  }
}
