import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { ReportEmailAttachment, ReportRecipient, ReportShareInput, ReportShareResult } from '../../../core/models/api.models';

export type ReportShareType = 'commercial' | 'reporting';

@Component({
  selector: 'app-report-share-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (open) {
      <div class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,.45)">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ modalTitle }}</h5>
              <button type="button" class="btn-close" (click)="close()" [disabled]="sending()"></button>
            </div>
            <div class="modal-body">
              <p class="text-muted small mb-3">
                Envoi d’un résumé HTML par SMTP
                @if (includeAttachments) {
                  avec pièces jointes Excel et PDF.
                } @else {
                  configuré dans l’administration.
                }
              </p>
              @if (sectionHint) {
                <div class="alert alert-light py-2 px-3 small mb-3">
                  <i class="bi bi-layout-text-window me-1"></i>Section : <strong>{{ sectionHint }}</strong>
                </div>
              }
              <div class="mb-3">
                <label class="form-label">Destinataire</label>
                <select
                  class="form-select"
                  [(ngModel)]="toUserId"
                  [disabled]="sending() || ccAllUsers || loadingRecipients()"
                >
                  <option [ngValue]="null">— Choisir un utilisateur —</option>
                  @for (u of recipients(); track u.id) {
                    <option [ngValue]="u.id">{{ u.full_name }} ({{ u.email }})</option>
                  }
                </select>
              </div>
              <div class="form-check mb-3">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="cc-all-users"
                  [(ngModel)]="ccAllUsers"
                  [disabled]="sending()"
                />
                <label class="form-check-label" for="cc-all-users">
                  Mettre tous les utilisateurs actifs en copie (CC)
                </label>
              </div>
              @if (ccAllUsers && !toUserId) {
                <p class="small text-muted mb-3">
                  Sans destinataire principal, l’email part de votre adresse avec tous les autres utilisateurs en CC.
                </p>
              }
              <div class="mb-0">
                <label class="form-label">Message (optionnel)</label>
                <textarea
                  class="form-control"
                  rows="3"
                  [(ngModel)]="message"
                  [disabled]="sending()"
                  placeholder="Note accompagnant le rapport…"
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" (click)="close()" [disabled]="sending()">
                Annuler
              </button>
              <button type="button" class="btn btn-primary" (click)="send()" [disabled]="sending() || !canSend()">
                @if (sending()) {
                  <span class="spinner-border spinner-border-sm me-1"></span>
                  @if (includeAttachments) {
                    Préparation…
                  } @else {
                    Envoi…
                  }
                } @else {
                  Envoyer
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class ReportShareModalComponent implements OnChanges {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  @Input({ required: true }) open = false;
  @Input({ required: true }) reportType!: ReportShareType;
  @Input() month = '';
  @Input() from = '';
  @Input() to = '';
  @Input() currency = 'USD';
  @Input() sectionHint = '';
  @Input() modalTitle = 'Partager par email';
  @Input() includeAttachments = false;
  @Input() buildAttachments?: () => Promise<ReportEmailAttachment[]>;

  @Output() closed = new EventEmitter<void>();
  @Output() sent = new EventEmitter<ReportShareResult>();

  readonly sending = signal(false);
  readonly loadingRecipients = signal(false);
  readonly recipients = signal<ReportRecipient[]>([]);

  toUserId: number | null = null;
  ccAllUsers = false;
  message = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue === true) {
      this.loadRecipients();
    }
  }

  loadRecipients(): void {
    this.loadingRecipients.set(true);
    this.admin.listReportRecipients().subscribe({
      next: (res) => {
        this.recipients.set(res.data);
        this.loadingRecipients.set(false);
      },
      error: (err) => {
        this.loadingRecipients.set(false);
        const apiErr = err?.error?.error;
        const status = err?.status;
        if (status === 404) {
          this.toast.error('Service indisponible. Réessayez plus tard.');
          return;
        }
        if (status === 403) {
          this.toast.error('Droits insuffisants pour partager un rapport');
          return;
        }
        this.toast.error(apiErr || 'Impossible de charger les utilisateurs');
      },
    });
  }

  canSend(): boolean {
    return this.ccAllUsers || this.toUserId != null;
  }

  async send(): Promise<void> {
    if (!this.canSend()) return;
    const body: ReportShareInput = {
      report_type: this.reportType,
      cc_all_users: this.ccAllUsers,
      message: this.message.trim() || undefined,
    };
    if (this.sectionHint.trim()) {
      body.section = this.sectionHint.trim();
    }
    if (this.toUserId != null) {
      body.to_user_id = this.toUserId;
    }
    if (this.reportType === 'commercial') {
      body.month = this.month;
    } else {
      body.from = this.from;
      body.to = this.to;
      body.currency = this.currency;
    }

    this.sending.set(true);
    try {
      if (this.includeAttachments && this.buildAttachments) {
        body.attachments = await this.buildAttachments();
      }
    } catch {
      this.sending.set(false);
      this.toast.error('Échec génération des pièces jointes');
      return;
    }

    this.admin.shareReport(body).subscribe({
      next: (res) => {
        this.sending.set(false);
        const n = res.data.recipients;
        this.toast.success(`Rapport envoyé à ${n} destinataire(s)`);
        this.sent.emit(res.data);
        this.close();
      },
      error: (err) => {
        this.sending.set(false);
        this.toast.error(err?.error?.error || 'Échec envoi email');
      },
    });
  }

  close(): void {
    if (this.sending()) return;
    this.toUserId = null;
    this.ccAllUsers = false;
    this.message = '';
    this.closed.emit();
  }
}
