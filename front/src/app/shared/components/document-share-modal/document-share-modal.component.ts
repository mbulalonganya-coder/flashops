import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  DocumentShareInput,
  ReportEmailAttachment,
  ReportRecipient,
  ReportShareResult,
} from '../../../core/models/api.models';
import { arrayBufferToBase64 } from '../../utils/format.utils';

@Component({
  selector: 'app-document-share-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (open) {
      <div class="modal d-block document-share-backdrop" tabindex="-1" style="background: rgba(0,0,0,.55); z-index: 1065">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Partager par email</h5>
              <button type="button" class="btn-close" (click)="close()" [disabled]="sending()"></button>
            </div>
            <div class="modal-body">
              <p class="text-muted small mb-3">
                Envoi du document <strong>{{ filename }}</strong> en pièce jointe via SMTP.
              </p>
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
                  id="doc-cc-all-users"
                  [(ngModel)]="ccAllUsers"
                  [disabled]="sending()"
                />
                <label class="form-check-label" for="doc-cc-all-users">
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
                  placeholder="Note accompagnant le document…"
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" (click)="close()" [disabled]="sending()">
                Annuler
              </button>
              <button type="button" class="btn btn-primary" (click)="send()" [disabled]="sending() || !canSend() || !buffer">
                @if (sending()) {
                  <span class="spinner-border spinner-border-sm me-1"></span>
                  Envoi…
                } @else {
                  <i class="bi bi-envelope me-1"></i>
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
export class DocumentShareModalComponent implements OnChanges {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  @Input({ required: true }) open = false;
  @Input() subject = '';
  @Input() filename = 'document';
  @Input() contentType = 'application/octet-stream';
  @Input() buffer: ArrayBuffer | null = null;

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
        const status = err?.status;
        if (status === 404) {
          this.toast.error('Service indisponible. Réessayez plus tard.');
          return;
        }
        if (status === 403) {
          this.toast.error('Droits insuffisants pour partager un document');
          return;
        }
        this.toast.error(err?.error?.error || 'Impossible de charger les utilisateurs');
      },
    });
  }

  canSend(): boolean {
    return this.ccAllUsers || this.toUserId != null;
  }

  send(): void {
    if (!this.canSend() || !this.buffer) return;

    const attachments: ReportEmailAttachment[] = [
      {
        filename: this.filename,
        content_type: this.contentType,
        data_base64: arrayBufferToBase64(this.buffer),
      },
    ];

    const body: DocumentShareInput = {
      cc_all_users: this.ccAllUsers,
      message: this.message.trim() || undefined,
      subject: this.subject.trim() || undefined,
      attachments,
    };
    if (this.toUserId != null) {
      body.to_user_id = this.toUserId;
    }

    this.sending.set(true);
    this.admin.shareDocument(body).subscribe({
      next: (res) => {
        this.sending.set(false);
        const n = res.data.recipients;
        this.toast.success(`Document envoyé à ${n} destinataire(s)`);
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
