import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { GeoPoint } from '../../../core/models/api.models';
import { GoogleMapsLoaderService } from '../../../core/services/google-maps-loader.service';
import { formatNumberFr, formatValeurFr } from '../../utils/format.utils';
import { mapHeatColor, mapHeatStrokeColor, type HeatMetric } from '../../utils/heat-scale.utils';

type MapEngine = 'google' | 'leaflet';

@Component({
  selector: 'app-geo-map',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="geo-map-shell" [class.geo-map-shell--fullscreen]="fullscreen()">
      <button
        type="button"
        class="geo-map-fs-btn"
        (click)="toggleFullscreen($event)"
        [attr.aria-label]="fullscreen() ? 'Quitter le plein écran' : 'Agrandir la carte'"
        [title]="fullscreen() ? 'Quitter (Échap)' : 'Plein écran'"
      >
        <i class="bi" [class.bi-fullscreen]="!fullscreen()" [class.bi-fullscreen-exit]="fullscreen()"></i>
        @if (fullscreen()) {
          <span>Réduire</span>
        } @else {
          <span>Plein écran</span>
        }
      </button>
      @if (fullscreen()) {
        <div class="geo-map-fs-hint">Échap ou Réduire pour quitter</div>
      }
      @if (engine() === 'google') {
        <div class="geo-map-provider geo-map-provider--google">Google Maps</div>
      }
      @if (!staticPin && points.length) {
        <div class="geo-map-legend">
          <span class="small text-muted">{{ activityMetric === 'volume' ? 'Volume faible' : 'Valeur faible' }}</span>
          <span class="geo-map-swatch" [style.background]="heatColor(0.08)"></span>
          <span class="geo-map-swatch" [style.background]="heatColor(0.35)"></span>
          <span class="geo-map-swatch" [style.background]="heatColor(0.65)"></span>
          <span class="geo-map-swatch" [style.background]="heatColor(1)"></span>
          <span class="small text-muted">{{ activityMetric === 'volume' ? 'Volume fort' : 'Valeur forte' }}</span>
        </div>
      }
      <div
        class="geo-map-host"
        #mapHost
        [class.geo-map-host--pick]="pickMode"
        [style.height]="fullscreen() ? '100%' : height"
        (dblclick)="onHostDblClick($event)"
      ></div>
    </div>
  `,
  styles: [
    `
      .geo-map-shell {
        position: relative;
        width: 100%;
        border-radius: 0.5rem;
        overflow: hidden;
      }
      .geo-map-shell--fullscreen {
        position: fixed;
        inset: 0;
        z-index: 2100;
        border-radius: 0;
        background: var(--card-bg, #0f1115);
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
      }
      .geo-map-host--pick {
        cursor: crosshair;
      }
      .geo-map-host {
        width: 100%;
        height: 22rem;
        border-radius: 0.5rem;
        overflow: hidden;
        z-index: 0;
      }
      .geo-map-shell--fullscreen .geo-map-host {
        flex: 1 1 auto;
        min-height: 0;
        border-radius: 0.4rem;
        height: 100% !important;
      }
      .geo-map-fs-btn {
        position: absolute;
        top: 0.65rem;
        right: 0.65rem;
        z-index: 1000;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem 0.65rem;
        border: 1px solid color-mix(in srgb, var(--card-border, #ccc) 80%, transparent);
        border-radius: 0.4rem;
        background: color-mix(in srgb, var(--card-bg, #fff) 92%, transparent);
        color: inherit;
        font-size: 0.8rem;
        font-weight: 600;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
        cursor: pointer;
      }
      .geo-map-fs-btn:hover {
        filter: brightness(1.05);
      }
      .geo-map-fs-hint {
        position: absolute;
        top: 0.75rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        padding: 0.25rem 0.65rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--card-bg, #fff) 88%, transparent);
        font-size: 0.75rem;
        color: var(--bs-secondary-color, #6c757d);
        pointer-events: none;
      }
      .geo-map-provider {
        position: absolute;
        left: 0.65rem;
        bottom: 0.65rem;
        z-index: 1000;
        padding: 0.2rem 0.5rem;
        border-radius: 0.3rem;
        background: color-mix(in srgb, var(--card-bg, #fff) 90%, transparent);
        font-size: 0.7rem;
        font-weight: 600;
        pointer-events: none;
      }
      .geo-map-provider--google {
        color: #1a73e8;
      }
      .geo-map-legend {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin-bottom: 0.5rem;
      }
      .geo-map-swatch {
        width: 0.85rem;
        height: 0.85rem;
        border-radius: 3px;
        border: 1px solid color-mix(in srgb, var(--card-border, #ccc) 70%, transparent);
      }
      :host ::ng-deep .geo-hex-icon {
        background: transparent;
        border: none;
      }
      :host ::ng-deep .geo-hex-icon svg {
        display: block;
        overflow: visible;
      }
      :host ::ng-deep .leaflet-control-attribution {
        display: none !important;
      }
    `,
  ],
})
export class GeoMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapHost', { static: true }) mapHost!: ElementRef<HTMLDivElement>;
  @Input() points: GeoPoint[] = [];
  @Input() height = '22rem';
  @Input() staticPin = false;
  /** Activity scale for marker size and heat color (dashboard map). */
  @Input() activityMetric: HeatMetric = 'value';
  /** When true, map clicks emit coordinates (edit / place pin). */
  @Input() pickMode = false;
  /**
   * Opt-in Google Maps only. Default false → OpenStreetMap (léger).
   * Pick mode works on OSM; do not force Google.
   */
  @Input() preferGoogle = false;
  @Output() agencyClick = new EventEmitter<number>();
  @Output() locationPick = new EventEmitter<{ lat: number; lng: number }>();

  private readonly gmapsLoader = inject(GoogleMapsLoaderService);
  private readonly zone = inject(NgZone);

  readonly fullscreen = signal(false);
  readonly engine = signal<MapEngine>('leaflet');
  readonly heatColor = mapHeatColor;

  private leafletMap?: L.Map;
  private leafletLayer?: L.LayerGroup;
  private googleMap?: google.maps.Map;
  private googleMarkers: google.maps.Marker[] = [];
  private googleInfo?: google.maps.InfoWindow;
  private googleDblClickListener?: google.maps.MapsEventListener;
  private googleClickListener?: google.maps.MapsEventListener;
  private googleCameraListeners: google.maps.MapsEventListener[] = [];
  private leafletClickHandler?: (e: L.LeafletMouseEvent) => void;
  private ready = false;
  private destroyed = false;
  private lastFingerprint = '';
  private sizeTimer?: ReturnType<typeof setTimeout>;
  /** After the user pans/zooms, never auto fitBounds again. */
  private userMovedCamera = false;
  /** Reuse hex DivIcons by size bucket (fewer DOM SVG builds). */
  private readonly hexIconCache = new Map<string, L.DivIcon>();

  async ngAfterViewInit(): Promise<void> {
    // Dashboard & lecture : OSM. Google uniquement si preferGoogle=true.
    let useGoogle = false;
    if (this.preferGoogle) {
      useGoogle = await this.gmapsLoader.load();
    }
    if (this.destroyed) return;

    this.zone.runOutsideAngular(() => {
      if (useGoogle) {
        this.engine.set('google');
        this.initGoogle();
      } else {
        this.engine.set('leaflet');
        this.initLeaflet();
      }
      this.bindPickListeners();
      this.bindCameraGuards();
      this.ready = true;
      this.renderPoints(true);
    });
    this.scheduleInvalidateSize(80);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.ready || this.destroyed) return;
    if (changes['height']) {
      this.scheduleInvalidateSize(80);
    }
    if (changes['pickMode']) {
      this.zone.runOutsideAngular(() => this.bindPickListeners());
    }
    if (changes['points'] || changes['staticPin'] || changes['pickMode'] || changes['activityMetric']) {
      this.zone.runOutsideAngular(() => this.renderPoints(false));
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.setBodyScrollLocked(false);
    if (this.sizeTimer != null) {
      clearTimeout(this.sizeTimer);
      this.sizeTimer = undefined;
    }
    this.zone.runOutsideAngular(() => {
      this.clearGoogleMarkers();
      this.unbindPickListeners();
      for (const l of this.googleCameraListeners) {
        google.maps.event.removeListener(l);
      }
      this.googleCameraListeners = [];
      if (this.googleDblClickListener) {
        google.maps.event.removeListener(this.googleDblClickListener);
        this.googleDblClickListener = undefined;
      }
      this.googleMap = undefined;
      this.googleInfo = undefined;
      try {
        this.leafletMap?.off();
        this.leafletMap?.remove();
      } catch {
        /* ignore */
      }
      this.leafletMap = undefined;
      this.leafletLayer = undefined;
      this.hexIconCache.clear();
    });
    this.ready = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.fullscreen()) {
      this.setFullscreen(false);
    }
  }

  toggleFullscreen(ev?: Event): void {
    ev?.preventDefault();
    ev?.stopPropagation();
    this.setFullscreen(!this.fullscreen());
  }

  onHostDblClick(ev: MouseEvent): void {
    if (this.pickMode) return;
    const t = ev.target as HTMLElement | null;
    if (t?.closest?.('.geo-hex-icon, .leaflet-marker-icon, .leaflet-popup, .gm-style-iw, .leaflet-control')) {
      return;
    }
    this.toggleFullscreen(ev);
  }

  private initGoogle(): void {
    this.googleMap = new google.maps.Map(this.mapHost.nativeElement, {
      center: { lat: -4.325, lng: 15.322 },
      zoom: 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      gestureHandling: 'greedy',
      scrollwheel: true,
      disableDoubleClickZoom: true,
      clickableIcons: false,
    });
    this.googleInfo = new google.maps.InfoWindow();
    this.googleDblClickListener = this.googleMap.addListener('dblclick', () => {
      if (!this.pickMode) this.zone.run(() => this.toggleFullscreen());
    });
  }

  private initLeaflet(): void {
    this.leafletMap = L.map(this.mapHost.nativeElement, {
      scrollWheelZoom: true,
      doubleClickZoom: false,
      zoomControl: true,
      attributionControl: false,
      // Less work during pan/zoom than default animated path redraws.
      fadeAnimation: false,
      zoomAnimation: true,
      markerZoomAnimation: false,
    }).setView([-4.325, 15.322], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '',
      updateWhenIdle: true,
      keepBuffer: 2,
    }).addTo(this.leafletMap);

    this.leafletLayer = L.layerGroup().addTo(this.leafletMap);
  }

  private bindCameraGuards(): void {
    if (this.googleMap) {
      const mark = () => {
        this.userMovedCamera = true;
      };
      this.googleCameraListeners.push(
        this.googleMap.addListener('dragstart', mark),
        this.googleMap.addListener('zoom_changed', mark)
      );
    }
    if (this.leafletMap) {
      this.leafletMap.on('dragstart zoomstart', () => {
        this.userMovedCamera = true;
      });
    }
  }

  private bindPickListeners(): void {
    this.unbindPickListeners();
    if (!this.pickMode) return;

    if (this.googleMap) {
      this.googleClickListener = this.googleMap.addListener('click', (e: google.maps.MapMouseEvent) => {
        const lat = e.latLng?.lat();
        const lng = e.latLng?.lng();
        if (lat == null || lng == null) return;
        this.zone.run(() => this.locationPick.emit({ lat, lng }));
      });
      this.googleMap.setOptions({ draggableCursor: 'crosshair' });
    }

    if (this.leafletMap) {
      this.leafletClickHandler = (e: L.LeafletMouseEvent) => {
        this.zone.run(() => this.locationPick.emit({ lat: e.latlng.lat, lng: e.latlng.lng }));
      };
      this.leafletMap.on('click', this.leafletClickHandler);
    }
  }

  private unbindPickListeners(): void {
    if (this.googleClickListener) {
      google.maps.event.removeListener(this.googleClickListener);
      this.googleClickListener = undefined;
    }
    if (this.googleMap) {
      try {
        this.googleMap.setOptions({ draggableCursor: '' });
      } catch {
        /* ignore */
      }
    }
    if (this.leafletMap && this.leafletClickHandler) {
      this.leafletMap.off('click', this.leafletClickHandler);
      this.leafletClickHandler = undefined;
    }
  }

  private setFullscreen(on: boolean): void {
    this.fullscreen.set(on);
    this.setBodyScrollLocked(on);
    this.leafletMap?.scrollWheelZoom.enable();
    this.googleMap?.setOptions({ scrollwheel: true });
    this.scheduleInvalidateSize(100);
    this.scheduleInvalidateSize(250);
  }

  private setBodyScrollLocked(locked: boolean): void {
    document.body.style.overflow = locked ? 'hidden' : '';
  }

  private renderPoints(force: boolean): void {
    if (this.destroyed) return;
    const pts = (this.points || []).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    const fingerprint = `${this.engine()}|${this.staticPin ? 1 : 0}|${this.activityMetric}|${pts
      .map((p) => {
        const act = pointActivity(p, this.activityMetric);
        return `${p.agency_id}:${p.lat.toFixed(5)}:${p.lng.toFixed(5)}:${Math.round(act)}`;
      })
      .join(';')}`;
    if (!force && fingerprint === this.lastFingerprint) {
      return;
    }
    this.lastFingerprint = fingerprint;

    // Keep camera stable: pick mode, or after the user has already moved the map.
    const preserveCamera = (this.pickMode && !force) || (!force && this.userMovedCamera);

    try {
      if (this.engine() === 'google' && this.googleMap) {
        this.renderGooglePoints(pts, preserveCamera);
      } else if (this.leafletMap && this.leafletLayer) {
        this.renderLeafletPoints(pts, preserveCamera);
      }
    } catch (err) {
      console.warn('[geo-map] render failed', err);
    }
  }

  private renderGooglePoints(pts: GeoPoint[], preserveCamera: boolean): void {
    if (!this.googleMap) return;
    this.clearGoogleMarkers();
    if (!pts.length) {
      if (!preserveCamera) {
        this.googleMap.setCenter({ lat: -4.325, lng: 15.322 });
        this.googleMap.setZoom(5);
      }
      return;
    }

    const sorted = sortPointsByActivity(pts, this.activityMetric);
    const maxAct = Math.max(...sorted.map((p) => pointActivity(p, this.activityMetric)), 1);
    const bounds = new google.maps.LatLngBounds();

    for (const p of sorted) {
      const activity = pointActivity(p, this.activityMetric);
      const intensity = maxAct > 0 ? activity / maxAct : 0;
      const radius = this.staticPin ? 14 : 6 + Math.sqrt(intensity) * 18;
      const width = Math.max(12, Math.round(radius * 2 / 2) * 2);
      const height = Math.max(10, Math.round(width * (Math.sqrt(3) / 2)));
      const fill = this.staticPin ? '#ffd500' : mapHeatColor(intensity);
      const stroke = this.staticPin ? '#1a1a1a' : mapHeatStrokeColor(intensity);
      const marker = new google.maps.Marker({
        map: this.googleMap,
        position: { lat: p.lat, lng: p.lng },
        optimized: true,
        zIndex: Math.round(intensity * 1000),
        icon: {
          url: hexIconDataUrl(width, height, fill, 0.88, stroke),
          scaledSize: new google.maps.Size(width, height),
          anchor: new google.maps.Point(width / 2, height / 2),
        },
        title: p.label,
      });
      if (!this.staticPin) {
        marker.addListener('click', () => {
          this.googleInfo?.setContent(
            `<div style="min-width:10rem"><strong>${escapeHtml(p.label)}</strong><br/>` +
              `<small>${escapeHtml(p.code)}</small><br/>` +
              `Volume ${formatNumberFr(p.tx_count)} · Valeur ${escapeHtml(formatValeurFr(p.volume, p.currency))}</div>`
          );
          this.googleInfo?.open({ map: this.googleMap, anchor: marker });
          this.zone.run(() => this.agencyClick.emit(p.agency_id));
        });
      }
      this.googleMarkers.push(marker);
      bounds.extend({ lat: p.lat, lng: p.lng });
    }

    if (preserveCamera) return;

    if (pts.length === 1) {
      this.googleMap.setCenter({ lat: pts[0].lat, lng: pts[0].lng });
      this.googleMap.setZoom(13);
    } else {
      this.googleMap.fitBounds(bounds, 48);
    }
  }

  private renderLeafletPoints(pts: GeoPoint[], preserveCamera: boolean): void {
    if (!this.leafletMap || !this.leafletLayer) return;
    this.leafletLayer.clearLayers();
    if (!pts.length) {
      if (!preserveCamera) {
        this.leafletMap.setView([-4.325, 15.322], 5);
      }
      return;
    }

    const sorted = sortPointsByActivity(pts, this.activityMetric);
    const maxAct = Math.max(...sorted.map((p) => pointActivity(p, this.activityMetric)), 1);
    const bounds = L.latLngBounds([]);

    for (const p of sorted) {
      const activity = pointActivity(p, this.activityMetric);
      const intensity = maxAct > 0 ? activity / maxAct : 0;
      const radius = this.staticPin ? 14 : 6 + Math.sqrt(intensity) * 18;
      const width = Math.max(12, Math.round(radius * 2 / 2) * 2);
      const height = Math.max(10, Math.round(width * (Math.sqrt(3) / 2)));
      const fill = this.staticPin ? '#ffd500' : mapHeatColor(intensity);
      const stroke = this.staticPin ? '#1a1a1a' : mapHeatStrokeColor(intensity);
      const icon = this.getHexDivIcon(width, height, fill, stroke);
      const marker = L.marker([p.lat, p.lng], {
        icon,
        riseOnHover: false,
        keyboard: false,
      });
      if (!this.staticPin) {
        marker.bindPopup(
          `<strong>${escapeHtml(p.label)}</strong><br/>` +
            `<small>${escapeHtml(p.code)}</small><br/>` +
            `Volume ${formatNumberFr(p.tx_count)} · Valeur ${escapeHtml(formatValeurFr(p.volume, p.currency))}`
        );
        marker.on('click', () => this.zone.run(() => this.agencyClick.emit(p.agency_id)));
      }
      marker.addTo(this.leafletLayer);
      bounds.extend([p.lat, p.lng]);
    }

    if (preserveCamera || !bounds.isValid()) return;

    if (pts.length === 1) {
      this.leafletMap.setView([pts[0].lat, pts[0].lng], 13);
    } else {
      this.leafletMap.fitBounds(bounds.pad(0.2), { maxZoom: 12 });
    }
  }

  private clearGoogleMarkers(): void {
    for (const m of this.googleMarkers) {
      try {
        google.maps.event.clearInstanceListeners(m);
        m.setMap(null);
      } catch {
        /* ignore */
      }
    }
    this.googleMarkers = [];
    try {
      this.googleInfo?.close();
    } catch {
      /* ignore */
    }
  }

  private getHexDivIcon(width: number, height: number, fill: string, stroke: string): L.DivIcon {
    const key = `${width}x${height}:${fill}:${stroke}`;
    let icon = this.hexIconCache.get(key);
    if (!icon) {
      icon = L.divIcon({
        className: 'geo-hex-icon',
        iconSize: [width, height],
        iconAnchor: [width / 2, height / 2],
        html: flatTopHexSvg(width, height, fill, 0.88, stroke),
      });
      this.hexIconCache.set(key, icon);
    }
    return icon;
  }

  private scheduleInvalidateSize(delay = 100): void {
    if (this.sizeTimer != null) clearTimeout(this.sizeTimer);
    this.sizeTimer = setTimeout(() => {
      this.sizeTimer = undefined;
      if (this.destroyed) return;
      this.zone.runOutsideAngular(() => {
        try {
          this.leafletMap?.invalidateSize({ animate: false });
        } catch {
          /* ignore */
        }
        if (this.googleMap) {
          try {
            const c = this.googleMap.getCenter();
            google.maps.event.trigger(this.googleMap, 'resize');
            if (c) this.googleMap.setCenter(c);
          } catch {
            /* ignore */
          }
        }
      });
    }, delay);
  }
}

function pointActivity(p: GeoPoint, metric: HeatMetric): number {
  return metric === 'volume' ? p.tx_count || 0 : p.volume || 0;
}

function sortPointsByActivity(pts: GeoPoint[], metric: HeatMetric): GeoPoint[] {
  return [...pts].sort(
    (a, b) => pointActivity(a, metric) - pointActivity(b, metric)
  );
}

function flatTopHexSvg(
  w: number,
  h: number,
  fill = '#ffd500',
  fillOpacity = 0.75,
  stroke = '#1a1a1a'
): string {
  const points = [
    [w * 0.25, 0],
    [w * 0.75, 0],
    [w, h * 0.5],
    [w * 0.75, h],
    [w * 0.25, h],
    [0, h * 0.5],
  ]
    .map(([x, y]) => `${x},${y}`)
    .join(' ');
  return (
    `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">` +
    `<polygon points="${points}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="1" stroke-linejoin="miter"/>` +
    `</svg>`
  );
}

function hexIconDataUrl(
  w: number,
  h: number,
  fill = '#ffd500',
  fillOpacity = 0.75,
  stroke = '#1a1a1a'
): string {
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(flatTopHexSvg(w, h, fill, fillOpacity, stroke));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
