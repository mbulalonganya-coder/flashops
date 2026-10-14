import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface RuntimeConfig {
  apiUrl?: string;
  googleMapsApiKey?: string;
}

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private readonly http = inject(HttpClient);
  private config: RuntimeConfig = {};

  get apiUrl(): string {
    return (this.config.apiUrl?.trim() || environment.apiUrl).replace(/\/$/, '');
  }

  get googleMapsApiKey(): string {
    return (this.config.googleMapsApiKey || '').trim();
  }

  async load(): Promise<void> {
    try {
      this.config = await firstValueFrom(
        this.http.get<RuntimeConfig>(`runtime-config.json?v=${Date.now()}`)
      );
    } catch {
      this.config = {};
    }
  }
}
