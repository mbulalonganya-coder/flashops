import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom, tap } from 'rxjs';
import { AuthTokens, LoginResponse, User } from '../models/api.models';
import { RuntimeConfigService } from './runtime-config.service';

const ACCESS_KEY = 'flashops_access_token';
const REFRESH_KEY = 'flashops_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly runtime = inject(RuntimeConfigService);

  private get baseUrl(): string {
    return this.runtime.apiUrl;
  }

  private readonly userSignal = signal<User | null>(null);
  private readonly loadingSignal = signal(false);
  private refreshPromise: Promise<string | null> | null = null;

  readonly user = this.userSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userSignal());
  readonly permissionCodes = computed(() => this.userSignal()?.permission_codes ?? []);
  readonly roleCode = computed(() => this.userSignal()?.role?.code ?? '');

  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  can(permission: string): boolean {
    if (this.roleCode() === 'ADMIN') return true;
    return this.permissionCodes().includes(permission);
  }

  canAny(...permissions: string[]): boolean {
    if (this.roleCode() === 'ADMIN') return true;
    const codes = this.permissionCodes();
    return permissions.some((p) => codes.includes(p));
  }

  async initSession(): Promise<void> {
    if (!this.accessToken) return;
    this.loadingSignal.set(true);
    try {
      const res = await firstValueFrom(
        this.http.get<{ user: User }>(`${this.baseUrl}/auth/me`)
      );
      this.userSignal.set(res.user);
    } catch {
      await this.tryRefresh();
    } finally {
      this.loadingSignal.set(false);
    }
  }

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, { email, password }).pipe(
      tap((res) => this.persistSession(res))
    );
  }

  loginWithToken(token: string) {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login/token`, { token }).pipe(
      tap((res) => this.persistSession(res))
    );
  }

  logout(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this.userSignal.set(null);
    this.router.navigate(['/login']);
  }

  async tryRefresh(): Promise<string | null> {
    if (this.refreshPromise) return this.refreshPromise;
    const refresh = this.refreshToken;
    if (!refresh) {
      this.logout();
      return null;
    }

    this.refreshPromise = (async () => {
      try {
        const tokenRes = await firstValueFrom(
          this.http.post<{ tokens: AuthTokens }>(`${this.baseUrl}/auth/refresh`, {
            refresh_token: refresh,
          })
        );
        localStorage.setItem(ACCESS_KEY, tokenRes.tokens.access_token);
        if (tokenRes.tokens.refresh_token) {
          localStorage.setItem(REFRESH_KEY, tokenRes.tokens.refresh_token);
        }
        const meRes = await firstValueFrom(
          this.http.get<{ user: User }>(`${this.baseUrl}/auth/me`)
        );
        this.userSignal.set(meRes.user);
        return tokenRes.tokens.access_token;
      } catch {
        this.logout();
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private persistSession(res: LoginResponse): void {
    localStorage.setItem(ACCESS_KEY, res.tokens.access_token);
    localStorage.setItem(REFRESH_KEY, res.tokens.refresh_token);
    this.userSignal.set(res.user);
  }
}
