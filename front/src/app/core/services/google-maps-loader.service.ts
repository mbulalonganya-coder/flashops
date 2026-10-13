import { Injectable, inject } from '@angular/core';
import { RuntimeConfigService } from './runtime-config.service';

const CALLBACK = '__flashOpsGmapsBoot';

declare global {
  interface Window {
    google?: typeof google;
    gm_authFailure?: () => void;
    [CALLBACK]?: () => void;
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  private readonly runtime = inject(RuntimeConfigService);
  private loading?: Promise<boolean>;

  /** Loads Maps JS API when a key is configured. Returns false if unavailable. */
  load(): Promise<boolean> {
    const key = this.runtime.googleMapsApiKey;
    if (!key) {
      console.warn('[gmaps] Pas de googleMapsApiKey dans runtime-config.json — fallback OSM');
      return Promise.resolve(false);
    }
    if (window.google?.maps?.Map) {
      return Promise.resolve(true);
    }
    if (this.loading) {
      return this.loading;
    }

    this.loading = new Promise<boolean>((resolve) => {
      const finish = (ok: boolean, reason?: string) => {
        if (!ok) {
          this.loading = undefined;
          console.warn('[gmaps] Chargement échoué — fallback OSM', reason || '');
        }
        resolve(ok);
      };

      window.gm_authFailure = () => {
        finish(false, 'clé invalide / API non activée / restrictions referrer (gm_authFailure)');
      };

      window[CALLBACK] = () => {
        delete window[CALLBACK];
        finish(!!window.google?.maps?.Map, 'callback sans google.maps.Map');
      };

      const script = document.createElement('script');
      script.dataset['flashOpsGmaps'] = '1';
      script.async = true;
      script.defer = true;
      script.src =
        `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}` +
        `&callback=${CALLBACK}&v=weekly`;
      script.onerror = () => {
        delete window[CALLBACK];
        finish(false, 'script maps.googleapis.com bloqué (réseau / adblock)');
      };
      document.head.appendChild(script);
    });

    return this.loading;
  }
}
