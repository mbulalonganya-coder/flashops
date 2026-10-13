import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonType =
  | 'text'
  | 'title'
  | 'avatar'
  | 'button'
  | 'table'
  | 'chart'
  | 'donut'
  | 'kpi'
  | 'list'
  | 'search'
  | 'card';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    @switch (type) {
      @case ('kpi') {
        <div class="sk-kpi" aria-hidden="true">
          <div class="sk sk-circle sk-kpi-icon"></div>
          <div class="sk-kpi-body">
            <div class="sk sk-line" style="width: 42%"></div>
            <div class="sk sk-line sk-line-lg" style="width: 68%"></div>
          </div>
        </div>
      }
      @case ('chart') {
        <div class="sk-chart" [style.min-height]="height || '16rem'" aria-hidden="true">
          <div class="sk-chart-bars">
            @for (h of chartBars; track $index) {
              <div class="sk sk-bar" [style.height]="h"></div>
            }
          </div>
          <div class="sk-chart-axis">
            @for (_ of [1, 2, 3, 4, 5, 6]; track $index) {
              <div class="sk sk-line sk-line-xs" style="width: 100%"></div>
            }
          </div>
        </div>
      }
      @case ('donut') {
        <div class="sk-donut-wrap" [style.min-height]="height || '14rem'" aria-hidden="true">
          <div class="sk sk-donut"></div>
          <div class="sk-donut-legend">
            @for (_ of rowItems; track $index) {
              <div class="sk-donut-legend-row">
                <div class="sk sk-circle sk-dot"></div>
                <div class="sk sk-line" [style.width]="legendWidths[$index % legendWidths.length]"></div>
              </div>
            }
          </div>
        </div>
      }
      @case ('table') {
        <div class="sk-table" aria-hidden="true">
          <div class="sk-table-head">
            @for (_ of colItems; track $index) {
              <div class="sk sk-line sk-line-sm" [style.width]="colWidths[$index % colWidths.length]"></div>
            }
          </div>
          @for (row of rowItems; track row) {
            <div class="sk-table-row">
              @for (col of colItems; track col) {
                <div
                  class="sk sk-line"
                  [style.width]="cellWidths[(row + col) % cellWidths.length]"
                ></div>
              }
            </div>
          }
        </div>
      }
      @case ('list') {
        <div class="sk-list" aria-hidden="true">
          @for (_ of rowItems; track $index) {
            <div class="sk-list-row">
              <div class="sk sk-circle sk-avatar-sm"></div>
              <div class="sk-list-body">
                <div class="sk sk-line" [style.width]="listTitleWidths[$index % listTitleWidths.length]"></div>
                <div class="sk sk-line sk-line-sm" [style.width]="listSubWidths[$index % listSubWidths.length]"></div>
              </div>
            </div>
          }
        </div>
      }
      @case ('search') {
        <div class="sk-search" aria-hidden="true">
          @for (_ of [1, 2, 3, 4]; track $index) {
            <div class="sk-search-row">
              <div class="sk sk-line" [style.width]="listTitleWidths[$index % listTitleWidths.length]"></div>
              <div class="sk sk-line sk-line-sm" style="width: 35%"></div>
            </div>
          }
        </div>
      }
      @case ('card') {
        <div class="sk-card" aria-hidden="true">
          <div class="sk sk-line sk-line-md" style="width: 45%"></div>
          <div class="sk sk-block" [style.height]="height || '8rem'"></div>
          <div class="sk sk-line" style="width: 70%"></div>
          <div class="sk sk-line sk-line-sm" style="width: 55%"></div>
        </div>
      }
      @case ('avatar') {
        <div class="sk sk-circle" [style.width]="size" [style.height]="size" aria-hidden="true"></div>
      }
      @case ('button') {
        <div class="sk sk-button" [style.width]="width || '6.5rem'" aria-hidden="true"></div>
      }
      @case ('title') {
        <div
          class="sk sk-line sk-line-lg"
          [style.width]="width || '40%'"
          [class]="className"
          aria-hidden="true"
        ></div>
      }
      @default {
        <div
          class="sk sk-line"
          [style.width]="width || '100%'"
          [style.height]="height || null"
          [class]="className"
          aria-hidden="true"
        ></div>
      }
    }
  `,
})
export class SkeletonComponent {
  @Input() type: SkeletonType = 'text';
  @Input() rows = 5;
  @Input() cols = 4;
  @Input() width?: string;
  @Input() height?: string;
  @Input() size = '2.5rem';
  @Input() className = '';

  readonly colWidths = ['55%', '70%', '48%', '62%', '40%'];
  readonly cellWidths = ['72%', '58%', '80%', '45%', '66%', '38%'];
  readonly listTitleWidths = ['62%', '74%', '48%', '68%', '55%'];
  readonly listSubWidths = ['40%', '52%', '35%', '46%'];
  readonly legendWidths = ['55%', '70%', '48%', '62%'];
  readonly chartBars = ['42%', '68%', '55%', '82%', '48%', '74%', '60%', '90%', '52%', '70%'];

  get rowItems(): number[] {
    return Array.from({ length: Math.max(1, this.rows) }, (_, i) => i);
  }

  get colItems(): number[] {
    return Array.from({ length: Math.max(1, this.cols) }, (_, i) => i);
  }
}
