import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { RuntimeConfigService } from './core/services/runtime-config.service';
import { AppSettingsService } from './core/services/app-settings.service';
import { AppLoadingService } from './core/services/app-loading.service';
import { AppResumeService } from './core/services/app-resume.service';

function initApp(
  runtime: RuntimeConfigService,
  settings: AppSettingsService,
  auth: AuthService,
  theme: ThemeService,
  loading: AppLoadingService,
  resume: AppResumeService
) {
  return async () => {
    loading.show('Initialisation…');
    try {
      await runtime.load();
      await settings.load();
      theme.set(theme.mode());
      await auth.initSession();
      resume.init();
    } finally {
      loading.hide();
      document.getElementById('app-splash')?.remove();
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      deps: [
        RuntimeConfigService,
        AppSettingsService,
        AuthService,
        ThemeService,
        AppLoadingService,
        AppResumeService,
      ],
      multi: true,
    },
  ],
};
