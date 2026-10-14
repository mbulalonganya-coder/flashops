import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserActionDetail } from '../../../core/models/api.models';

@Component({
  selector: 'app-action-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open && action) {
      <div class="parametrages-modal-backdrop" (click)="close.emit()">
        <div
          class="parametrages-modal card shadow-lg"
          role="dialog"
          aria-modal="true"
          aria-labelledby="action-detail-title"
          (click)="$event.stopPropagation()"
        >
          <div class="card-header parametrages-modal__header">
            <h2 id="action-detail-title" class="h6 mb-0">Détail de l'action</h2>
            <button type="button" class="btn btn-icon btn-sm" (click)="close.emit()" aria-label="Fermer">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="card-body">
            <dl class="row parametrages-detail-dl mb-0">
              <dt class="col-sm-4">Date</dt>
              <dd class="col-sm-8">{{ action.created_at | date: 'dd/MM/yyyy HH:mm:ss' }}</dd>
              <dt class="col-sm-4">Libellé</dt>
              <dd class="col-sm-8">{{ action.label }}</dd>
              <dt class="col-sm-4">Code</dt>
              <dd class="col-sm-8"><code>{{ action.action_code }}</code></dd>
              <dt class="col-sm-4">Module</dt>
              <dd class="col-sm-8">{{ action.module || '—' }}</dd>
              <dt class="col-sm-4">Utilisateur</dt>
              <dd class="col-sm-8">
                @if (action.user) {
                  {{ action.user.full_name }} — {{ action.user.email }}
                } @else {
                  —
                }
              </dd>
              <dt class="col-sm-4">Adresse IP</dt>
              <dd class="col-sm-8">{{ action.ip_address || '—' }}</dd>
              <dt class="col-sm-4">User-Agent</dt>
              <dd class="col-sm-8 text-break">{{ action.user_agent || '—' }}</dd>
            </dl>
            @if (action.details) {
              <hr class="my-3" />
              <p class="small fw-semibold mb-2">Données associées</p>
              <pre class="small bg-body-secondary rounded p-3 mb-0">{{ action.details | json }}</pre>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class ActionDetailModalComponent {
  @Input({ required: true }) open = false;
  @Input() action: UserActionDetail | null = null;
  @Output() close = new EventEmitter<void>();
}
