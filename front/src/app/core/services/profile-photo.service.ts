import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs';
import { User } from '../models/api.models';
import { RuntimeConfigService } from './runtime-config.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ProfilePhotoService {
  private readonly http = inject(HttpClient);
  private readonly runtime = inject(RuntimeConfigService);
  private readonly auth = inject(AuthService);

  private readonly cache = new Map<string, string>();

  private cacheKey(user: User): string | null {
    if (!user.has_profile_photo) return null;
    return `${user.id}:${user.profile_photo_updated_at ?? '0'}`;
  }

  photoUrl(user: User | null | undefined): Observable<string | null> {
    if (!user?.has_profile_photo) {
      return of(null);
    }
    const key = this.cacheKey(user);
    if (!key) return of(null);
    const hit = this.cache.get(key);
    if (hit) return of(hit);

    const token = this.auth.accessToken;
    if (!token) return of(null);

    const url = `${this.runtime.apiUrl}/auth/profile-photo/${user.id}`;
    return this.http
      .get(url, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      })
      .pipe(
        map((blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.cache.set(key, objectUrl);
          return objectUrl;
        }),
        shareReplay(1)
      );
  }

  invalidate(userId: number): void {
    for (const [key, url] of this.cache.entries()) {
      if (key.startsWith(`${userId}:`)) {
        URL.revokeObjectURL(url);
        this.cache.delete(key);
      }
    }
  }
}
