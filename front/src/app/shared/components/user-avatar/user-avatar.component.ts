import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../core/models/api.models';
import { ProfilePhotoService } from '../../../core/services/profile-photo.service';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="user-avatar-root"
      [class.user-avatar-root--lg]="size === 'lg'"
      [class.user-avatar-root--sm]="size === 'sm'"
      [attr.aria-hidden]="decorative ? 'true' : null"
      [attr.role]="decorative ? null : 'img'"
      [attr.aria-label]="decorative ? null : ariaLabel"
    >
      @if (photoUrl()) {
        <img class="user-avatar-img" [src]="photoUrl()" alt="" />
      } @else {
        <span class="user-avatar-initials">{{ initials() }}</span>
      }
    </span>
  `,
  styles: `
    .user-avatar-root {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      background: var(--flash-yellow);
      color: var(--flash-black);
      font-weight: 700;
      font-size: 0.8rem;
      overflow: hidden;
      flex-shrink: 0;
    }

    .user-avatar-root--lg {
      width: 3.5rem;
      height: 3.5rem;
      font-size: 1.1rem;
    }

    .user-avatar-root--sm {
      width: 1.75rem;
      height: 1.75rem;
      font-size: 0.7rem;
    }

    .user-avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .user-avatar-initials {
      line-height: 1;
    }
  `,
})
export class UserAvatarComponent implements OnChanges {
  private readonly photos = inject(ProfilePhotoService);

  @Input({ required: true }) user!: User;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() decorative = true;

  readonly photoUrl = signal<string | null>(null);

  get ariaLabel(): string {
    return `Photo de ${this.user.full_name || this.user.email}`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user']) {
      this.loadPhoto();
    }
  }

  initials(): string {
    const source = (this.user.full_name || this.user.email || '?').trim();
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  private loadPhoto(): void {
    this.photoUrl.set(null);
    this.photos.photoUrl(this.user).subscribe({
      next: (url) => this.photoUrl.set(url),
      error: () => this.photoUrl.set(null),
    });
  }
}
