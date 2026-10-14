import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BRANDING } from '../constants/branding';
import { PublicAppSettings } from '../models/api.models';
import { RuntimeConfigService } from './runtime-config.service';

const defaults: PublicAppSettings = {
  app_name: environment.appName,
  app_short_name: 'Flash',
  app_url: 'http://localhost:4200',
  logo_light: BRANDING.logoLight,
  logo_dark: BRANDING.logoDark,
  favicon: BRANDING.favicon,
  default_language: 'fr',
  timezone: 'Africa/Kinshasa',
};

function pickUrl(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function mergePublicSettings(partial: Partial<PublicAppSettings>): PublicAppSettings {
  return {
    ...defaults,
    ...partial,
    logo_light: pickUrl(partial.logo_light, defaults.logo_light),
    logo_dark: pickUrl(partial.logo_dark, defaults.logo_dark),
    favicon: pickUrl(partial.favicon, defaults.favicon),
    app_name: partial.app_name?.trim() || defaults.app_name,
    app_short_name: partial.app_short_name?.trim() || defaults.app_short_name,
    default_language: partial.default_language?.trim() || defaults.default_language,
    timezone: partial.timezone?.trim() || defaults.timezone,
  };
}

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
      this.apply(mergePublicSettings(response.data));
    } catch {
      this.apply(defaults);
    }
  }

  apply(settings: PublicAppSettings): void {
    const next = mergePublicSettings(settings);
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
      link.type = 'image/png';
      link.href = next.favicon;
    }
  }
}
