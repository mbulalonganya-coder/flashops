import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Agency, GeoPoint, Transaction } from '../../../core/models/api.models';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { GeoMapComponent } from '../geo-map/geo-map.component';
import { CurrencyFrPipe } from '../../pipes/currency-fr.pipe';
import { DateFrPipe } from '../../pipes/date-fr.pipe';
import { formatAgencyLabel } from '../../utils/format.utils';

@Component({
  selector: 'app-agency-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    EmptyStateComponent,
    SkeletonComponent,
    GeoMapComponent,
    CurrencyFrPipe,
    DateFrPipe,
  ],
  template: `
    @if (agency) {
      <div
        class="modal fade show d-block agency-detail-modal"
        tabindex="-1"
        role="dialog"
        style="background: rgba(0,0,0,.45)"
      >
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h5 class="modal-title">{{ agencyTitle() }}</h5>
                <small class="text-muted">{{ agency.code_agence }}</small>
                @if (linkedMembers().length > 1) {
                  <div class="small text-muted mt-1">
                    Vue groupée · {{ linkedMembers().length }} comptes liés
                  </div>
                }
              </div>
              <button type="button" class="btn-close" (click)="closed.emit()"></button>
            </div>
            <div class="modal-body">
              @if (linkedMembers().length > 1) {
                <h6 class="mb-2">Comptes liés</h6>
                <div class="d-flex flex-wrap gap-2 mb-4">
                  @for (m of linkedMembers(); track m.id) {
                    <span
                      class="badge rounded-pill text-bg-light border font-monospace fw-normal"
                      [class.border-primary]="m.id === agency.id"
                    >
                      {{ m.code_agence }}
                      @if (m.flash_id) {
                        <span class="text-muted"> · {{ m.flash_id }}</span>
                      }
                      <span [class.text-success]="m.is_active" [class.text-muted]="!m.is_active">
                        · {{ m.is_active ? 'Actif' : 'Inactif' }}
                      </span>
                    </span>
                  }
                </div>
              }

              <div class="row g-3 mb-4">
                <div class="col-md-6"><strong>Catégorie</strong><br />{{ displayAgency().category_label || '—' }}</div>
                <div class="col-md-6"><strong>Région</strong><br />{{ displayAgency().region?.label || '—' }}</div>
                <div class="col-md-6"><strong>Zone</strong><br />{{ displayAgency().zone?.label || '—' }}</div>
                <div class="col-md-6"><strong>Groupe SAG</strong><br />{{ displayAgency().sag_group?.label || '—' }}</div>
                <div class="col-md-6"><strong>Flash ID</strong><br />{{ displayAgency().flash_id || '—' }}</div>
                <div class="col-md-6"><strong>Nom court</strong><br />{{ displayAgency().short_name || '—' }}</div>
                <div class="col-md-6"><strong>Provider</strong><br />{{ displayAgency().provider || '—' }}</div>
                <div class="col-md-6"><strong>Ville</strong><br />{{ displayAgency().city || '—' }}</div>
                <div class="col-md-6"><strong>Commune</strong><br />{{ displayAgency().commune || '—' }}</div>
                <div class="col-md-6"><strong>Province</strong><br />{{ displayAgency().province || '—' }}</div>
                <div class="col-md-6"><strong>Pays</strong><br />{{ displayAgency().country || '—' }}</div>
                <div class="col-12"><strong>Adresse</strong><br />{{ displayAgency().address || '—' }}</div>
                <div class="col-md-6"><strong>WU POS (USD)</strong><br />{{ displayAgency().wu_pos_usd || '—' }}</div>
                <div class="col-md-6"><strong>WU POS (CDF)</strong><br />{{ displayAgency().wu_pos_cdf || '—' }}</div>
                <div class="col-md-6"><strong>Compte MG</strong><br />{{ displayAgency().mg_account || '—' }}</div>
                <div class="col-md-6"><strong>Label SAG WU</strong><br />{{ displayAgency().sag_wu_label || '—' }}</div>
                <div class="col-md-6"><strong>Téléphone</strong><br />{{ displayAgency().phone1 || displayAgency().phone2 || '—' }}</div>
                <div class="col-md-6"><strong>Ouverture</strong><br />{{ displayAgency().opened_at || '—' }}</div>
              </div>

              @if (mapPoints().length) {
                <h6 class="mb-2">Emplacement</h6>
                <div class="agency-map-wrap mb-4">
                  <app-geo-map [points]="mapPoints()" [staticPin]="true" height="14rem" />
                </div>
              }

              <h6 class="mb-3">
                Dernières transactions
                @if (linkedMembers().length > 1) {
                  <span class="text-muted fw-normal">(tous comptes)</span>
                }
              </h6>
              @if (detailLoading()) {
                <app-skeleton type="table" [rows]="5" [cols]="linkedMembers().length > 1 ? 5 : 4" />
              } @else if (!detailTx().length) {
                <app-empty-state title="Aucune transaction récente" icon="bi bi-receipt" />
              } @else {
                <div class="table-responsive">
                  <table class="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th>Date</th>
                        @if (linkedMembers().length > 1) {
                          <th>Compte</th>
                        }
                        <th>Produit</th>
                        <th class="text-end">Montant</th>
                        <th class="text-end">ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (tx of detailTx(); track tx.id) {
                        <tr>
                          <td>{{ tx.transaction_at | dateFr }}</td>
                          @if (linkedMembers().length > 1) {
                            <td class="font-monospace small">{{ tx.agency_code || '—' }}</td>
                          }
                          <td>{{ tx.product_code }}</td>
                          <td class="text-end">{{ tx.amount | currencyFr: tx.currency }}</td>
                          <td class="text-end font-monospace small">{{ tx.id }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .agency-detail-modal {
        z-index: 1060;
      }
      .agency-map-wrap {
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 0.5rem;
        overflow: hidden;
      }
    `,
  ],
})
export class AgencyDetailModalComponent implements OnChanges {
  private readonly api = inject(ApiService);

  @Input() agency: Agency | null = null;
  @Output() closed = new EventEmitter<void>();

  readonly detailTx = signal<Transaction[]>([]);
  readonly detailLoading = signal(false);
  readonly linkedMembers = signal<Agency[]>([]);
  readonly mapPoints = signal<GeoPoint[]>([]);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['agency']) {
      this.loadDetail();
    }
  }

  agencyTitle(): string {
    return this.agency ? formatAgencyLabel(this.agency) : '';
  }

  /** Best metadata across linked accounts (Flash ID, GPS, adresse…). */
  displayAgency(): Agency {
    const base = this.agency;
    if (!base) {
      return {} as Agency;
    }
    const members = this.linkedMembers();
    if (members.length <= 1) {
      return base;
    }
    return mergeAgencyMetadata(base, members);
  }

  private loadDetail(): void {
    const agency = this.agency;
    if (!agency) {
      this.detailTx.set([]);
      this.linkedMembers.set([]);
      this.mapPoints.set([]);
      return;
    }
    this.detailLoading.set(true);
    this.api
      .getAgencyMembers(agency.id)
      .pipe(
        switchMap((group) =>
          this.resolveMembers(agency, group).pipe(map((members) => ({ group, members })))
        ),
        switchMap(({ group, members }) => {
          const ids = members.map((m) => m.id);
          const canonicalId = group.canonical_id || agency.id;
          const txAgencyId = ids.includes(canonicalId) ? canonicalId : agency.id;
          return this.api
            .getTransactions({
              agency_id: txAgencyId,
              include_linked: true,
              limit: 30,
              include_total: false,
            })
            .pipe(map((tx) => ({ members, tx })));
        })
      )
      .subscribe({
        next: ({ members, tx }) => {
          this.linkedMembers.set(members);
          this.detailTx.set(tx.data ?? []);
          this.mapPoints.set(toGroupMapPoints(members));
          this.detailLoading.set(false);
        },
        error: () => {
          this.resolveMembers(agency, { canonical_id: agency.id, members: [agency] }).subscribe({
            next: (members) => {
              this.linkedMembers.set(members);
              this.mapPoints.set(toGroupMapPoints(members));
              this.api
                .getTransactions({
                  agency_id: agency.id,
                  include_linked: true,
                  limit: 30,
                  include_total: false,
                })
                .subscribe({
                  next: (tx) => {
                    this.detailTx.set(tx.data ?? []);
                    this.detailLoading.set(false);
                  },
                  error: () => {
                    this.detailTx.set([]);
                    this.detailLoading.set(false);
                  },
                });
            },
            error: () => {
              this.linkedMembers.set([agency]);
              this.detailTx.set([]);
              this.mapPoints.set(toAgencyMapPoints(agency));
              this.detailLoading.set(false);
            },
          });
        },
      });
  }

  private resolveMembers(agency: Agency, group: { canonical_id: number; members: Agency[] }) {
    if (group.members.length > 1) {
      return of(group.members);
    }
    const codes = [...new Set([agency.code_agence, ...(agency.alias_codes ?? [])].filter(Boolean))];
    if (codes.length <= 1 && (agency.member_count ?? 0) <= 1) {
      return of([agency]);
    }
    return forkJoin(
      codes.map((code) => this.api.getAgencies({ search: code, limit: 50, group_canonical: false }))
    ).pipe(
      map((pages) => {
        const byCode = new Map<string, Agency>();
        for (const page of pages) {
          for (const row of page.data ?? []) {
            byCode.set(row.code_agence.toUpperCase(), row);
          }
        }
        const members: Agency[] = [];
        for (const code of codes) {
          const hit = byCode.get(code.toUpperCase());
          if (hit) {
            members.push(hit);
          }
        }
        if (!members.some((m) => m.id === agency.id)) {
          members.unshift(agency);
        }
        return members.length > 1 ? members : [agency];
      })
    );
  }
}

function mergeAgencyMetadata(base: Agency, members: Agency[]): Agency {
  const pick = (getter: (a: Agency) => string | undefined | null): string | undefined => {
    for (const m of members) {
      const v = getter(m);
      if (v != null && String(v).trim() !== '') {
        return String(v);
      }
    }
    return undefined;
  };
  return {
    ...base,
    flash_id: pick((a) => a.flash_id),
    short_name: pick((a) => a.short_name),
    provider: pick((a) => a.provider),
    city: pick((a) => a.city),
    commune: pick((a) => a.commune),
    province: pick((a) => a.province),
    country: pick((a) => a.country),
    address: pick((a) => a.address),
    wu_pos_usd: pick((a) => a.wu_pos_usd),
    wu_pos_cdf: pick((a) => a.wu_pos_cdf),
    mg_account: pick((a) => a.mg_account),
    sag_wu_label: pick((a) => a.sag_wu_label),
    phone1: pick((a) => a.phone1),
    phone2: pick((a) => a.phone2),
    opened_at: pick((a) => a.opened_at),
    category_label: pick((a) => a.category_label) ?? base.category_label,
    region: members.find((m) => m.region)?.region ?? base.region,
    zone: members.find((m) => m.zone)?.zone ?? base.zone,
    sag_group: members.find((m) => m.sag_group)?.sag_group ?? base.sag_group,
    latitude: pick((a) => a.latitude),
    longitude: pick((a) => a.longitude),
    is_active: members.some((m) => m.is_active),
  };
}

function parseCoord(raw?: string | null): number | null {
  if (raw == null || raw === '') return null;
  const n = Number(String(raw).trim().replace(',', '.'));
  if (!Number.isFinite(n) || n === 0) return null;
  return n;
}

function toAgencyMapPoints(agency: Agency | null): GeoPoint[] {
  if (!agency) return [];
  const lat = parseCoord(agency.latitude);
  const lng = parseCoord(agency.longitude);
  if (lat == null || lng == null) return [];
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return [];
  return [
    {
      agency_id: agency.id,
      code: agency.code_agence,
      label: formatAgencyLabel(agency),
      city: agency.city,
      commune: agency.commune,
      lat,
      lng,
      tx_count: agency.tx_count_total || 0,
      volume: 0,
      currency: 'USD',
    },
  ];
}

function toGroupMapPoints(members: Agency[]): GeoPoint[] {
  const points: GeoPoint[] = [];
  for (const agency of members) {
    points.push(...toAgencyMapPoints(agency));
  }
  return points;
}
