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
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  Agency,
  AgencyUpdateInput,
  Category,
  GeoPoint,
  Region,
} from '../../../core/models/api.models';
import { GeoMapComponent } from '../geo-map/geo-map.component';

@Component({
  selector: 'app-agency-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, GeoMapComponent],
  template: `
    @if (agency) {
      <div
        class="modal fade show d-block agency-edit-modal"
        tabindex="-1"
        role="dialog"
        style="background: rgba(0,0,0,.45)"
      >
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h5 class="modal-title">Modifier l’agence</h5>
                <small class="text-muted font-monospace">{{ agency.code_agence }}</small>
              </div>
              <button type="button" class="btn-close" (click)="closed.emit()" [disabled]="saving()"></button>
            </div>
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-lg-6">
                  <div class="row g-3">
                    <div class="col-12">
                      <label class="form-label">Nom <span class="text-danger">*</span></label>
                      <input class="form-control" [(ngModel)]="form.name" name="name" required maxlength="200" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Nom court</label>
                      <input class="form-control" [(ngModel)]="form.short_name" name="short_name" maxlength="50" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Flash ID</label>
                      <input class="form-control" [(ngModel)]="form.flash_id" name="flash_id" maxlength="20" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Catégorie</label>
                      <select class="form-select" [(ngModel)]="form.category_id" name="category_id">
                        <option [ngValue]="null">—</option>
                        @for (c of categories; track c.id) {
                          <option [ngValue]="c.id">{{ c.code }} — {{ c.label }}</option>
                        }
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Région</label>
                      <select class="form-select" [(ngModel)]="form.region_id" name="region_id">
                        <option [ngValue]="null">—</option>
                        @for (r of regions; track r.id) {
                          <option [ngValue]="r.id">{{ r.label }}</option>
                        }
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Provider</label>
                      <input class="form-control" [(ngModel)]="form.provider" name="provider" maxlength="50" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Statut</label>
                      <select class="form-select" [(ngModel)]="form.is_active" name="is_active">
                        <option [ngValue]="true">Actif</option>
                        <option [ngValue]="false">Inactif</option>
                      </select>
                    </div>
                    <div class="col-12">
                      <label class="form-label">Adresse</label>
                      <textarea class="form-control" rows="2" [(ngModel)]="form.address" name="address"></textarea>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Ville</label>
                      <input class="form-control" [(ngModel)]="form.city" name="city" maxlength="100" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Commune</label>
                      <input class="form-control" [(ngModel)]="form.commune" name="commune" maxlength="100" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Province</label>
                      <input class="form-control" [(ngModel)]="form.province" name="province" maxlength="100" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Pays</label>
                      <input class="form-control" [(ngModel)]="form.country" name="country" maxlength="50" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Téléphone 1</label>
                      <input class="form-control" [(ngModel)]="form.phone1" name="phone1" maxlength="50" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Téléphone 2</label>
                      <input class="form-control" [(ngModel)]="form.phone2" name="phone2" maxlength="50" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">WU POS (USD)</label>
                      <input class="form-control" [(ngModel)]="form.wu_pos_usd" name="wu_pos_usd" maxlength="50" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">WU POS (CDF)</label>
                      <input class="form-control" [(ngModel)]="form.wu_pos_cdf" name="wu_pos_cdf" maxlength="50" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Compte MG</label>
                      <input class="form-control" [(ngModel)]="form.mg_account" name="mg_account" maxlength="80" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Label SAG WU</label>
                      <input class="form-control" [(ngModel)]="form.sag_wu_label" name="sag_wu_label" maxlength="200" />
                    </div>
                  </div>
                </div>

                <div class="col-lg-6">
                  <div class="d-flex flex-wrap align-items-end gap-2 mb-2">
                    <div class="flex-grow-1">
                      <label class="form-label">Latitude</label>
                      <input
                        class="form-control font-monospace"
                        [(ngModel)]="form.latitude"
                        name="latitude"
                        (ngModelChange)="onCoordTyped()"
                        placeholder="-4.325"
                      />
                    </div>
                    <div class="flex-grow-1">
                      <label class="form-label">Longitude</label>
                      <input
                        class="form-control font-monospace"
                        [(ngModel)]="form.longitude"
                        name="longitude"
                        (ngModelChange)="onCoordTyped()"
                        placeholder="15.322"
                      />
                    </div>
                    <button type="button" class="btn btn-outline-secondary btn-sm mb-1" (click)="clearCoords()">
                      Effacer
                    </button>
                  </div>
                  <p class="small text-muted mb-2">
                    Cliquez sur la carte pour définir la position.
                  </p>
                  <div class="agency-map-wrap">
                    <app-geo-map
                      [points]="mapPoints()"
                      [staticPin]="true"
                      [pickMode]="true"
                      height="22rem"
                      (locationPick)="onMapPick($event)"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" (click)="closed.emit()" [disabled]="saving()">
                Annuler
              </button>
              <button type="button" class="btn btn-primary" (click)="save()" [disabled]="saving() || !form.name.trim()">
                @if (saving()) {
                  <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                }
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .agency-edit-modal {
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
export class AgencyEditModalComponent implements OnChanges {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  @Input() agency: Agency | null = null;
  @Input() categories: Category[] = [];
  @Input() regions: Region[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Agency>();

  readonly saving = signal(false);
  readonly mapPoints = signal<GeoPoint[]>([]);

  form = emptyForm();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['agency'] && this.agency) {
      this.form = toForm(this.agency);
      this.refreshMapPoints();
    }
  }

  onMapPick(pos: { lat: number; lng: number }): void {
    this.form.latitude = formatCoord(pos.lat);
    this.form.longitude = formatCoord(pos.lng);
    this.refreshMapPoints();
  }

  onCoordTyped(): void {
    this.refreshMapPoints();
  }

  clearCoords(): void {
    this.form.latitude = '';
    this.form.longitude = '';
    this.mapPoints.set([]);
  }

  save(): void {
    if (!this.agency || this.saving()) return;
    const name = this.form.name.trim();
    if (!name) {
      this.toast.warning('Le nom est requis.');
      return;
    }

    const lat = parseCoord(this.form.latitude);
    const lng = parseCoord(this.form.longitude);
    if ((lat == null) !== (lng == null)) {
      this.toast.warning('Renseignez latitude et longitude ensemble, ou laissez les deux vides.');
      return;
    }
    if (lat != null && (lat < -90 || lat > 90)) {
      this.toast.warning('Latitude hors plage (−90 à 90).');
      return;
    }
    if (lng != null && (lng < -180 || lng > 180)) {
      this.toast.warning('Longitude hors plage (−180 à 180).');
      return;
    }

    const body: AgencyUpdateInput = {
      name,
      category_id: this.form.category_id,
      region_id: this.form.region_id,
      is_active: this.form.is_active,
      flash_id: blankToNull(this.form.flash_id),
      short_name: blankToNull(this.form.short_name),
      sag_wu_label: blankToNull(this.form.sag_wu_label),
      wu_pos_usd: blankToNull(this.form.wu_pos_usd),
      wu_pos_cdf: blankToNull(this.form.wu_pos_cdf),
      mg_account: blankToNull(this.form.mg_account),
      address: blankToNull(this.form.address),
      commune: blankToNull(this.form.commune),
      city: blankToNull(this.form.city),
      province: blankToNull(this.form.province),
      country: blankToNull(this.form.country),
      provider: blankToNull(this.form.provider),
      phone1: blankToNull(this.form.phone1),
      phone2: blankToNull(this.form.phone2),
      latitude: lat == null ? null : formatCoord(lat),
      longitude: lng == null ? null : formatCoord(lng),
    };

    this.saving.set(true);
    this.api.updateAgency(this.agency.id, body).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.toast.success('Agence mise à jour.');
        this.saved.emit(updated);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.error || 'Échec de la mise à jour.';
        this.toast.error(msg);
      },
    });
  }

  private refreshMapPoints(): void {
    const lat = parseCoord(this.form.latitude);
    const lng = parseCoord(this.form.longitude);
    if (lat == null || lng == null || !this.agency) {
      this.mapPoints.set([]);
      return;
    }
    this.mapPoints.set([
      {
        agency_id: this.agency.id,
        code: this.agency.code_agence,
        label: this.form.name.trim() || this.agency.name,
        lat,
        lng,
        volume: 0,
        tx_count: 0,
        currency: 'USD',
      },
    ]);
  }
}

interface EditForm {
  name: string;
  short_name: string;
  flash_id: string;
  category_id: number | null;
  region_id: number | null;
  provider: string;
  is_active: boolean;
  address: string;
  city: string;
  commune: string;
  province: string;
  country: string;
  phone1: string;
  phone2: string;
  wu_pos_usd: string;
  wu_pos_cdf: string;
  mg_account: string;
  sag_wu_label: string;
  latitude: string;
  longitude: string;
}

function emptyForm(): EditForm {
  return {
    name: '',
    short_name: '',
    flash_id: '',
    category_id: null,
    region_id: null,
    provider: '',
    is_active: true,
    address: '',
    city: '',
    commune: '',
    province: '',
    country: '',
    phone1: '',
    phone2: '',
    wu_pos_usd: '',
    wu_pos_cdf: '',
    mg_account: '',
    sag_wu_label: '',
    latitude: '',
    longitude: '',
  };
}

function toForm(a: Agency): EditForm {
  return {
    name: a.name || '',
    short_name: a.short_name || '',
    flash_id: a.flash_id || '',
    category_id: a.category_id ?? null,
    region_id: a.region?.id ?? null,
    provider: a.provider || '',
    is_active: !!a.is_active,
    address: a.address || '',
    city: a.city || '',
    commune: a.commune || '',
    province: a.province || '',
    country: a.country || '',
    phone1: a.phone1 || '',
    phone2: a.phone2 || '',
    wu_pos_usd: a.wu_pos_usd || '',
    wu_pos_cdf: a.wu_pos_cdf || '',
    mg_account: a.mg_account || '',
    sag_wu_label: a.sag_wu_label || '',
    latitude: a.latitude || '',
    longitude: a.longitude || '',
  };
}

function blankToNull(v: string): string | null {
  const s = (v || '').trim();
  return s ? s : null;
}

function parseCoord(raw: string): number | null {
  const s = (raw || '').trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function formatCoord(n: number): string {
  return String(Math.round(n * 1e6) / 1e6);
}
