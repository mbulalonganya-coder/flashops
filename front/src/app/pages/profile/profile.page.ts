import {
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SectionCardComponent } from '../../shared/components/section-card/section-card.component';
import { ProfileAccountModalComponent } from '../../shared/components/profile-account-modal/profile-account-modal.component';
import { ProfilePhotoModalComponent } from '../../shared/components/profile-photo-modal/profile-photo-modal.component';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';
import { ProfilePhotoService } from '../../core/services/profile-photo.service';
import { ToastService } from '../../core/services/toast.service';
import { DateFrPipe } from '../../shared/pipes/date-fr.pipe';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    SectionCardComponent,
    ProfileAccountModalComponent,
    ProfilePhotoModalComponent,
    UserAvatarComponent,
    DateFrPipe,
  ],
  template: `
    <app-page-header title="Mon profil" subtitle="Compte et sécurité" />

    @if (auth.user(); as user) {
      <div class="row g-4">
        <div class="col-12">
          <app-section-card title="Identité" subtitle="Nom et e-mail de connexion">
            <div class="profile-identity">
              <app-user-avatar [user]="user" size="lg" />
              <div class="profile-identity__main">
                <h3 class="profile-identity__name">{{ user.full_name || user.email }}</h3>
                <p class="profile-identity__email mb-0">{{ user.email }}</p>
              </div>
              <span class="badge profile-role-badge">{{ user.role.label || user.role.code }}</span>
            </div>

            <dl class="profile-dl mt-4 mb-4">
              <div class="profile-dl__row">
                <dt>Rôle</dt>
                <dd>{{ user.role.label }} <span class="text-muted">({{ user.role.code }})</span></dd>
              </div>
              <div class="profile-dl__row">
                <dt>Dernière connexion</dt>
                <dd>{{ user.last_login_at | dateFr }}</dd>
              </div>
              <div class="profile-dl__row">
                <dt>Identifiant</dt>
                <dd class="font-monospace">#{{ user.id }}</dd>
              </div>
            </dl>

            <div class="profile-actions-menu" [class.is-open]="actionsOpen()">
              <button
                type="button"
                class="btn btn-icon profile-actions-menu__toggle"
                (click)="toggleActions($event)"
                [attr.aria-expanded]="actionsOpen()"
                aria-controls="profile-actions-panel"
                aria-haspopup="true"
                aria-label="Actions du compte"
                title="Actions"
              >
                <i class="bi bi-three-dots" aria-hidden="true"></i>
              </button>

              @if (actionsOpen()) {
                <div id="profile-actions-panel" class="profile-actions-menu__panel shadow-sm">
                  <button
                    type="button"
                    class="profile-actions-menu__item"
                    (click)="openPhotoModal()"
                  >
                    <i class="bi bi-camera"></i>
                    {{ user.has_profile_photo ? 'Modifier la photo' : 'Ajouter une photo' }}
                  </button>
                  @if (user.has_profile_photo) {
                    <button
                      type="button"
                      class="profile-actions-menu__item"
                      (click)="removePhoto()"
                      [disabled]="photoBusy()"
                    >
                      <i class="bi bi-trash"></i>
                      Supprimer la photo
                    </button>
                  }
                  <button
                    type="button"
                    class="profile-actions-menu__item profile-actions-menu__item--primary"
                    (click)="openAccountModal()"
                  >
                    <i class="bi bi-pencil-square"></i>
                    Modifier les informations du compte
                  </button>
                </div>
              }
            </div>
          </app-section-card>
        </div>
      </div>

      <app-profile-account-modal
        [open]="editModalOpen()"
        [user]="user"
        (close)="editModalOpen.set(false)"
      />

      <app-profile-photo-modal
        [open]="photoModalOpen()"
        (close)="photoModalOpen.set(false)"
        (saved)="onPhotoSaved()"
      />
    }
  `,
  styles: `
    .profile-identity {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem 1.25rem;
    }

    .profile-actions-menu {
      position: relative;
      display: inline-block;
    }

    .profile-actions-menu__toggle .bi-three-dots {
      font-size: 1.35rem;
      line-height: 1;
    }

    .profile-actions-menu__panel {
      position: absolute;
      left: 0;
      top: calc(100% + 0.35rem);
      z-index: 20;
      min-width: min(100%, 20rem);
      width: max-content;
      max-width: min(100vw - 2rem, 22rem);
      padding: 0.35rem;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--flash-radius, 0.75rem);
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .profile-actions-menu__item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      width: 100%;
      padding: 0.55rem 0.75rem;
      border: 0;
      border-radius: 0.5rem;
      background: transparent;
      color: var(--text-primary);
      font-size: 0.9375rem;
      text-align: left;
      cursor: pointer;
    }

    .profile-actions-menu__item:hover:not(:disabled),
    .profile-actions-menu__item:focus-visible:not(:disabled) {
      background: var(--flash-gray-100);
    }

    [data-bs-theme='dark'] .profile-actions-menu__item:hover:not(:disabled),
    [data-bs-theme='dark'] .profile-actions-menu__item:focus-visible:not(:disabled) {
      background: #2a2a2a;
    }

    .profile-actions-menu__item:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .profile-actions-menu__item--primary {
      font-weight: 600;
      color: var(--flash-black);
      background: rgba(255, 213, 0, 0.18);
    }

    .profile-actions-menu__item--primary:hover:not(:disabled),
    .profile-actions-menu__item--primary:focus-visible:not(:disabled) {
      background: rgba(255, 213, 0, 0.32);
    }

    .profile-identity__main {
      flex: 1;
      min-width: 12rem;
    }

    .profile-identity__name {
      margin: 0 0 0.15rem;
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    .profile-identity__email {
      color: var(--text-muted);
      font-size: 0.9375rem;
    }

    .profile-role-badge {
      background: rgba(255, 213, 0, 0.2);
      color: var(--text-primary);
      border: 1px solid rgba(255, 213, 0, 0.45);
      font-weight: 600;
      padding: 0.45rem 0.75rem;
    }

    .profile-dl__row {
      display: grid;
      grid-template-columns: minmax(8rem, 11rem) 1fr;
      gap: 0.35rem 1rem;
      padding: 0.65rem 0;
      border-bottom: 1px solid var(--card-border);
    }

    .profile-dl__row:last-child {
      border-bottom: 0;
    }

    .profile-dl dt {
      margin: 0;
      color: var(--text-muted);
      font-weight: 500;
      font-size: 0.875rem;
    }

    .profile-dl dd {
      margin: 0;
      font-size: 0.9375rem;
    }
  `,
})
export class ProfilePageComponent {
  readonly auth = inject(AuthService);
  private readonly photos = inject(ProfilePhotoService);
  private readonly toast = inject(ToastService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly editModalOpen = signal(false);
  readonly photoModalOpen = signal(false);
  readonly photoBusy = signal(false);
  readonly actionsOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.actionsOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.actionsOpen.set(false);
  }

  toggleActions(event: MouseEvent): void {
    event.stopPropagation();
    this.actionsOpen.update((v) => !v);
  }

  openPhotoModal(): void {
    this.actionsOpen.set(false);
    this.photoModalOpen.set(true);
  }

  openAccountModal(): void {
    this.actionsOpen.set(false);
    this.editModalOpen.set(true);
  }

  onPhotoSaved(): void {
    const user = this.auth.user();
    if (user) this.photos.invalidate(user.id);
  }

  async removePhoto(): Promise<void> {
    if (this.photoBusy()) return;
    this.actionsOpen.set(false);
    this.photoBusy.set(true);
    try {
      const res = await firstValueFrom(this.auth.deleteProfilePhoto());
      if (res.user) this.photos.invalidate(res.user.id);
      this.toast.success('Photo supprimée');
    } catch {
      this.toast.error('Impossible de supprimer la photo.');
    } finally {
      this.photoBusy.set(false);
    }
  }
}
