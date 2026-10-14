import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';

const MAX_FILE_BYTES = 800_000;

@Component({
  selector: 'app-branding-image-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="branding-image-field">
      <label class="form-label" [for]="inputId">{{ label }}</label>
      <div class="branding-image-field__row">
        <div class="branding-image-field__preview" aria-hidden="true">
          @if (previewUrl) {
            <img [src]="previewUrl" alt="" />
          } @else {
            <i class="bi bi-image text-muted"></i>
          }
        </div>
        <div class="branding-image-field__inputs">
          <input
            [id]="inputId"
            type="text"
            class="form-control"
            [name]="inputName"
            [ngModel]="value"
            (ngModelChange)="valueChange.emit($event)"
            placeholder="/branding/logo.png ou https://…"
          />
          <label class="branding-image-field__file btn btn-outline-secondary btn-sm">
            Parcourir…
            <input type="file" accept="image/*" hidden (change)="onFile($event)" />
          </label>
        </div>
      </div>
    </div>
  `,
  styles: `
    .branding-image-field__row {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }

    .branding-image-field__preview {
      width: 3.5rem;
      height: 3.5rem;
      flex-shrink: 0;
      border: 1px solid var(--card-border);
      border-radius: 0.5rem;
      background: var(--flash-gray-50);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .branding-image-field__preview img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .branding-image-field__inputs {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .branding-image-field__file {
      align-self: flex-start;
      margin: 0;
    }
  `,
})
export class BrandingImageFieldComponent {
  private readonly toast = inject(ToastService);

  @Input({ required: true }) label!: string;
  @Input({ required: true }) inputName!: string;
  @Input() inputId = '';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  get previewUrl(): string {
    const v = this.value?.trim();
    if (!v) return '';
    if (v.startsWith('data:') || v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/')) {
      return v;
    }
    return '';
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast.error('Choisissez une image');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      this.toast.error('Image trop volumineuse (max. 800 Ko)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.valueChange.emit(String(reader.result ?? ''));
    };
    reader.onerror = () => this.toast.error('Lecture du fichier impossible');
    reader.readAsDataURL(file);
  }
}
