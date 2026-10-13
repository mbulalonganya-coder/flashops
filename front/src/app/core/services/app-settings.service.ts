import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PublicAppSettings } from '../models/api.models';
import { RuntimeConfigService } from './runtime-config.service';

const defaults: PublicAppSettings = {
  app_name: environment.appName,
  app_short_name: 'Flash',
  app_url: 'http://localhost:4200',
  logo_light: '',
  logo_dark: '',
  favicon: '',
  default_language: 'fr',
};

@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  private readonly http = inject(HttpClient);
  private readonly runtime = inject(RuntimeConfigService);
  private readonly settingsSignal = signal<PublicAppSettings>(defaults);

  readonly settings = this.settingsSignal.asReadonly();

  async load(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ data: PublicAppSettings }>(`${this.runtime.apiUrl}/config/public`)
      );
      this.apply(response.data);
    } catch {
      this.apply(defaults);
    }
  }

  apply(settings: PublicAppSettings): void {
    const next = { ...defaults, ...settings };
    this.settingsSignal.set(next);
    document.title = next.app_name;
    document.documentElement.lang = next.default_language;

    if (next.favicon) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = next.favicon;
    }
  }
}
