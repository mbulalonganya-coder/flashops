import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ProfilePhotoService } from '../../../core/services/profile-photo.service';
import { ToastService } from '../../../core/services/toast.service';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-profile-photo-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open) {
      <div class="profile-modal-backdrop">
        <div
          class="profile-photo-modal card shadow-lg"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-photo-title"
          (click)="$event.stopPropagation()"
        >
          <div class="card-header profile-photo-modal__header">
            <h2 id="profile-photo-title" class="h5 mb-0">Photo de profil</h2>
            <button type="button" class="btn btn-icon btn-sm" (click)="close.emit()" aria-label="Fermer">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="card-body">
            @if (step() === 'pick') {
              <p class="text-muted mb-3">
                Choisissez une image. Vous pourrez la déplacer et zoomer avant enregistrement.
              </p>
              <input
                #fileInput
                type="file"
                class="d-none"
                accept="image/jpeg,image/png,image/webp,image/gif"
                (change)="onFileSelected($event)"
              />
              <button type="button" class="btn btn-primary w-100" (click)="fileInput.click()">
                <i class="bi bi-upload me-2"></i>
                Choisir une image
              </button>
            } @else {
              <p class="profile-photo-modal__lead mb-2">
                <strong>Déplacez</strong> la photo avec la souris ou le doigt. <strong>Zoomez</strong> avec la molette,
                le pincement ou le curseur ci-dessous.
              </p>

              <div
                #viewport
                class="profile-photo-modal__viewport"
                [class.is-dragging]="dragging()"
                (pointerdown)="onPointerDown($event)"
                (pointermove)="onPointerMove($event)"
                (pointerup)="onPointerUp($event)"
                (pointercancel)="onPointerUp($event)"
                (wheel)="onWheel($event)"
              >
                @if (previewUrl()) {
                  <img
                    #sourceImg
                    class="profile-photo-modal__photo"
                    [src]="previewUrl()"
                    alt=""
                    draggable="false"
                    [style.transform]="photoTransform()"
                    (load)="onImageLoad()"
                  />
                }
                <div class="profile-photo-modal__frame" aria-hidden="true"></div>
              </div>

              <div class="profile-photo-modal__zoom" aria-label="Zoom">
                <button type="button" class="btn btn-icon btn-sm" (click)="nudgeZoom(-0.06)" title="Zoom arrière">
                  <i class="bi bi-dash-lg"></i>
                </button>
                <input
                  type="range"
                  class="form-range profile-photo-modal__zoom-range"
                  min="0"
                  max="100"
                  [value]="zoomSlider()"
                  (input)="onZoomSlider($event)"
                  aria-label="Niveau de zoom"
                />
                <button type="button" class="btn btn-icon btn-sm" (click)="nudgeZoom(0.06)" title="Zoom avant">
                  <i class="bi bi-plus-lg"></i>
                </button>
              </div>

              <div class="profile-photo-modal__preview-row">
                <div class="profile-photo-modal__preview-label">Aperçu avatar</div>
                <div
                  class="profile-photo-modal__preview-circle"
                  [style.background-image]="previewCircleStyle()"
                ></div>
              </div>
            }
          </div>

          @if (step() === 'crop') {
            <div class="card-footer profile-photo-modal__footer">
              <button type="button" class="btn btn-outline-secondary" (click)="backToPick()" [disabled]="uploading()">
                Changer d’image
              </button>
              <button type="button" class="btn btn-primary" (click)="save()" [disabled]="uploading() || !imageReady()">
                @if (uploading()) {
                  <span class="spinner-border spinner-border-sm me-2"></span>
                }
                Enregistrer
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: `
    .profile-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1060;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgba(17, 17, 17, 0.45);
      backdrop-filter: blur(4px);
    }

    .profile-photo-modal {
      width: min(100%, 28rem);
      max-height: min(94vh, 42rem);
      border: 1px solid var(--card-border);
      border-radius: var(--flash-radius, 0.75rem);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .profile-photo-modal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background: var(--card-bg);
      border-bottom: 1px solid var(--card-border);
    }

    .profile-photo-modal__lead {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.45;
    }

    .profile-photo-modal__viewport {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      max-height: min(72vw, 19rem);
      margin-inline: auto;
      overflow: hidden;
      background: #0a0a0a;
      border-radius: 0.65rem;
      border: 1px solid var(--card-border);
      cursor: grab;
      touch-action: none;
      user-select: none;
    }

    .profile-photo-modal__viewport.is-dragging {
      cursor: grabbing;
    }

    .profile-photo-modal__photo {
      position: absolute;
      left: 50%;
      top: 50%;
      max-width: none;
      max-height: none;
      pointer-events: none;
      will-change: transform;
    }

    .profile-photo-modal__frame {
      position: absolute;
      inset: 0;
      border: 3px solid var(--flash-yellow);
      border-radius: 2px;
      pointer-events: none;
      z-index: 3;
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.15);
    }

    .profile-photo-modal__zoom {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.85rem;
    }

    .profile-photo-modal__zoom-range {
      flex: 1;
      margin: 0;
    }

    .profile-photo-modal__preview-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 0.85rem;
      border-top: 1px solid var(--card-border);
    }

    .profile-photo-modal__preview-label {
      flex: 1;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .profile-photo-modal__preview-circle {
      width: 4rem;
      height: 4rem;
      border-radius: 50%;
      flex-shrink: 0;
      background-color: var(--flash-gray-200);
      background-size: cover;
      background-position: center;
      border: 2px solid var(--flash-yellow);
    }

    .profile-photo-modal__footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      background: var(--card-bg);
      border-top: 1px solid var(--card-border);
    }
  `,
})
export class ProfilePhotoModalComponent implements OnChanges, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly photos = inject(ProfilePhotoService);
  private readonly toast = inject(ToastService);

  @Input({ required: true }) open = false;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  @ViewChild('viewport') viewport?: ElementRef<HTMLElement>;
  @ViewChild('sourceImg') sourceImg?: ElementRef<HTMLImageElement>;

  readonly step = signal<'pick' | 'crop'>('pick');
  readonly previewUrl = signal<string | null>(null);
  readonly uploading = signal(false);
  readonly imageReady = signal(false);
  readonly dragging = signal(false);
  readonly zoomSlider = signal(50);
  readonly previewCircleStyle = signal<string | null>(null);

  private readonly offsetX = signal(0);
  private readonly offsetY = signal(0);
  private readonly scale = signal(1);

  readonly photoTransform = computed(() => {
    const s = this.scale();
    const x = this.offsetX();
    const y = this.offsetY();
    return `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${s})`;
  });

  private objectUrl: string | null = null;
  private minScale = 0.2;
  private maxScale = 4;
  private baseCoverScale = 1;
  private dragPointerId: number | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragOriginOffsetX = 0;
  private dragOriginOffsetY = 0;
  private pinchStartDistance = 0;
  private pinchStartScale = 1;
  private activePointers = new Map<number, { x: number; y: number }>();
  private previewFrame: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue === true) {
      this.backToPick();
    }
  }

  ngOnDestroy(): void {
    this.revokePreview();
    if (this.previewFrame !== null) {
      cancelAnimationFrame(this.previewFrame);
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.imageReady()) {
      this.clampOffsets();
      this.schedulePreviewUpdate();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast.error('Format non supporté.');
      return;
    }
    this.revokePreview();
    this.imageReady.set(false);
    this.objectUrl = URL.createObjectURL(file);
    this.previewUrl.set(this.objectUrl);
    this.step.set('crop');
    this.offsetX.set(0);
    this.offsetY.set(0);
    this.zoomSlider.set(50);
  }

  onImageLoad(): void {
    requestAnimationFrame(() => this.resetTransformToCover());
  }

  backToPick(): void {
    this.revokePreview();
    this.step.set('pick');
    this.imageReady.set(false);
    this.previewCircleStyle.set(null);
    this.dragging.set(false);
    this.activePointers.clear();
  }

  onPointerDown(event: PointerEvent): void {
    if (this.step() !== 'crop' || !this.viewport) return;
    this.viewport.nativeElement.setPointerCapture(event.pointerId);
    this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.activePointers.size === 1) {
      this.dragPointerId = event.pointerId;
      this.dragging.set(true);
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
      this.dragOriginOffsetX = this.offsetX();
      this.dragOriginOffsetY = this.offsetY();
    } else if (this.activePointers.size === 2) {
      this.dragPointerId = null;
      this.dragging.set(false);
      this.pinchStartDistance = this.pointerDistance();
      this.pinchStartScale = this.scale();
    }
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.activePointers.has(event.pointerId)) return;
    this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.activePointers.size >= 2) {
      const dist = this.pointerDistance();
      if (this.pinchStartDistance > 0) {
        const next = this.pinchStartScale * (dist / this.pinchStartDistance);
        this.setScale(next);
      }
      return;
    }

    if (this.dragPointerId !== event.pointerId) return;
    const dx = event.clientX - this.dragStartX;
    const dy = event.clientY - this.dragStartY;
    this.offsetX.set(this.dragOriginOffsetX + dx);
    this.offsetY.set(this.dragOriginOffsetY + dy);
    this.clampOffsets();
    this.schedulePreviewUpdate();
  }

  onPointerUp(event: PointerEvent): void {
    this.activePointers.delete(event.pointerId);
    if (this.dragPointerId === event.pointerId) {
      this.dragPointerId = null;
      this.dragging.set(false);
    }
    if (this.activePointers.size === 1) {
      const remaining = [...this.activePointers.keys()][0];
      const pt = this.activePointers.get(remaining)!;
      this.dragPointerId = remaining;
      this.dragging.set(true);
      this.dragStartX = pt.x;
      this.dragStartY = pt.y;
      this.dragOriginOffsetX = this.offsetX();
      this.dragOriginOffsetY = this.offsetY();
    }
    if (this.activePointers.size === 0) {
      this.dragging.set(false);
    }
  }

  onWheel(event: WheelEvent): void {
    if (this.step() !== 'crop' || !this.imageReady()) return;
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.05 : 0.05;
    this.nudgeZoom(delta);
  }

  nudgeZoom(delta: number): void {
    this.setScale(this.scale() + delta);
  }

  onZoomSlider(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.zoomSlider.set(value);
    const t = value / 100;
    const next = this.minScale + t * (this.maxScale - this.minScale);
    this.setScale(next, false);
  }

  async save(): Promise<void> {
    if (!this.imageReady() || this.uploading()) return;
    this.uploading.set(true);
    try {
      const blob = await this.exportCompressedJpeg();
      const res = await this.auth.uploadProfilePhotoAfterSessionCheck(blob);
      if (res?.user) {
        this.photos.invalidate(res.user.id);
      }
      this.toast.success('Photo de profil mise à jour');
      this.saved.emit();
      this.close.emit();
      this.backToPick();
    } catch (err: unknown) {
      this.handleError(err);
    } finally {
      this.uploading.set(false);
    }
  }

  private resetTransformToCover(): void {
    const img = this.sourceImg?.nativeElement;
    const box = this.viewport?.nativeElement;
    if (!img || !box || !img.naturalWidth) return;

    const vw = box.clientWidth;
    const vh = box.clientHeight;
    this.baseCoverScale = Math.max(vw / img.naturalWidth, vh / img.naturalHeight);
    this.minScale = this.baseCoverScale * 0.85;
    this.maxScale = this.baseCoverScale * 3.5;
    this.setScale(this.baseCoverScale * 1.05);
    this.offsetX.set(0);
    this.offsetY.set(0);
    this.imageReady.set(true);
    this.schedulePreviewUpdate();
  }

  private setScale(next: number, syncSlider = true): void {
    const clamped = Math.min(this.maxScale, Math.max(this.minScale, next));
    this.scale.set(clamped);
    this.clampOffsets();
    if (syncSlider) {
      const t = (clamped - this.minScale) / (this.maxScale - this.minScale);
      this.zoomSlider.set(Math.round(t * 100));
    }
    this.schedulePreviewUpdate();
  }

  private clampOffsets(): void {
    const img = this.sourceImg?.nativeElement;
    const box = this.viewport?.nativeElement;
    if (!img || !box) return;

    const vw = box.clientWidth;
    const vh = box.clientHeight;
    const s = this.scale();
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;

    const maxX = Math.max(0, (dw - vw) / 2);
    const maxY = Math.max(0, (dh - vh) / 2);

    this.offsetX.set(Math.min(maxX, Math.max(-maxX, this.offsetX())));
    this.offsetY.set(Math.min(maxY, Math.max(-maxY, this.offsetY())));
  }

  private pointerDistance(): number {
    const pts = [...this.activePointers.values()];
    if (pts.length < 2) return 0;
    const dx = pts[1].x - pts[0].x;
    const dy = pts[1].y - pts[0].y;
    return Math.hypot(dx, dy);
  }

  private schedulePreviewUpdate(): void {
    if (this.previewFrame !== null) {
      cancelAnimationFrame(this.previewFrame);
    }
    this.previewFrame = requestAnimationFrame(() => {
      this.previewFrame = null;
      this.updateCirclePreview();
    });
  }

  private updateCirclePreview(): void {
    const dataUrl = this.renderCropDataUrl(128);
    if (dataUrl) {
      this.previewCircleStyle.set(`url('${dataUrl}')`);
    }
  }

  private exportCompressedJpeg(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const dataUrl = this.renderCropDataUrl(512);
      if (!dataUrl) {
        reject(new Error('crop failed'));
        return;
      }
      fetch(dataUrl)
        .then((r) => r.blob())
        .then((blob) => {
          const out = blob.type === 'image/jpeg' ? blob : new Blob([blob], { type: 'image/jpeg' });
          resolve(out);
        })
        .catch(() => reject(new Error('compress failed')));
    });
  }

  private renderCropDataUrl(size: number): string | null {
    const img = this.sourceImg?.nativeElement;
    const box = this.viewport?.nativeElement;
    if (!img || !box || !img.naturalWidth) return null;

    const vw = box.clientWidth;
    const vh = box.clientHeight;
    const s = this.scale();
    const ox = this.offsetX();
    const oy = this.offsetY();

    const imgLeft = vw / 2 + ox - (img.naturalWidth * s) / 2;
    const imgTop = vh / 2 + oy - (img.naturalHeight * s) / 2;

    let sx = (0 - imgLeft) / s;
    let sy = (0 - imgTop) / s;
    let sw = vw / s;
    let sh = vh / s;

    sx = Math.max(0, Math.min(img.naturalWidth - sw, sx));
    sy = Math.max(0, Math.min(img.naturalHeight - sh, sy));
    sw = Math.min(sw, img.naturalWidth - sx);
    sh = Math.min(sh, img.naturalHeight - sy);

    const side = Math.min(sw, sh);
    sx += (sw - side) / 2;
    sy += (sh - side) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    return canvas.toDataURL('image/jpeg', 0.82);
  }

  private revokePreview(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.previewUrl.set(null);
  }

  private handleError(err: unknown): void {
    const httpErr = err instanceof HttpErrorResponse ? err : null;
    const fetchErr =
      err && typeof err === 'object' && 'status' in err
        ? (err as { status?: number; error?: { error?: string } })
        : null;
    const status = httpErr?.status ?? fetchErr?.status;
    const api =
      typeof httpErr?.error?.error === 'string'
        ? httpErr.error.error
        : typeof fetchErr?.error?.error === 'string'
          ? fetchErr.error.error
          : '';
    if (api === 'file too large') {
      this.toast.error('Image trop volumineuse après compression.');
    } else if (api === 'invalid image data' || api === 'invalid image type') {
      this.toast.error('Image invalide.');
    } else if (status === 401 || status === 403) {
      this.toast.warning('Session expirée. Reconnectez-vous.');
      this.auth.logout();
    } else if (err instanceof Error && err.message === 'missing access token') {
      this.toast.warning('Session expirée. Reconnectez-vous.');
      this.auth.logout();
    } else {
      this.toast.error('Impossible d’enregistrer la photo.');
    }
  }
}
