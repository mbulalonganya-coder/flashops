import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportTimeseriesPoint } from '../../../core/models/api.models';
import { formatNumberFr } from '../../utils/format.utils';
import { mapHeatColor, type HeatMetric } from '../../utils/heat-scale.utils';

interface HeatCell {
  date: string;
  label: string;
  value: number;
  intensity: number;
  color: string;
  dow: number;
}

@Component({
  selector: 'app-heatmap-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="heatmap-wrap">
      <div class="heatmap-legend mb-2">
        <span class="small text-muted">{{ metric === 'volume' ? 'Volume faible' : 'Valeur faible' }}</span>
        <span class="heat-swatch" [style.background]="heatColor(0.08)"></span>
        <span class="heat-swatch" [style.background]="heatColor(0.35)"></span>
        <span class="heat-swatch" [style.background]="heatColor(0.65)"></span>
        <span class="heat-swatch" [style.background]="heatColor(1)"></span>
        <span class="small text-muted">{{ metric === 'volume' ? 'Volume fort' : 'Valeur forte' }}</span>
      </div>
      <div class="heatmap-grid" role="list">
        @for (cell of cells; track cell.date) {
          <div
            class="heatmap-cell"
            [class.heatmap-cell--light-text]="cell.intensity >= 0.32"
            role="listitem"
            [style.background]="cell.color"
            [attr.title]="tooltip(cell)"
            [attr.aria-label]="tooltip(cell)"
          >
            <span class="heatmap-day">{{ cell.label }}</span>
          </div>
        }
      </div>
      @if (!cells.length) {
        <p class="text-muted small mb-0 mt-2">Aucune donnée journalière sur la période.</p>
      }
    </div>
  `,
  styles: [
    `
      .heatmap-legend {
        display: flex;
        align-items: center;
        gap: 0.35rem;
      }
      .heat-swatch {
        width: 0.85rem;
        height: 0.85rem;
        border-radius: 3px;
      }
      .heatmap-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(2.4rem, 1fr));
        gap: 0.3rem;
      }
      .heatmap-cell {
        aspect-ratio: 1;
        border-radius: 4px;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding: 0.15rem;
        cursor: default;
        min-height: 2.2rem;
      }
      .heatmap-day {
        font-size: 0.62rem;
        color: #1a1a1a;
        line-height: 1;
        font-weight: 600;
      }
      .heatmap-cell--light-text .heatmap-day {
        color: #fff;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
      }
    `,
  ],
})
export class HeatmapCalendarComponent implements OnChanges {
  @Input() data: ReportTimeseriesPoint[] = [];
  @Input() metric: HeatMetric = 'value';

  cells: HeatCell[] = [];

  ngOnChanges(): void {
    this.rebuild();
  }

  heatColor = mapHeatColor;

  tooltip(cell: HeatCell): string {
    const unit = this.metric === 'volume' ? 'tx' : '';
    return `${cell.date} — ${formatNumberFr(cell.value)}${unit ? ' ' + unit : ''}`;
  }

  private rebuild(): void {
    const byDate = new Map<string, number>();
    for (const row of this.data) {
      const key = row.period;
      const val = this.metric === 'volume' ? row.tx_count : row.amount_sum;
      byDate.set(key, (byDate.get(key) || 0) + (val || 0));
    }
    const values = [...byDate.values()];
    const max = Math.max(0, ...values);
    this.cells = [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => {
        const d = new Date(`${date}T00:00:00`);
        const intensity = max > 0 ? value / max : 0;
        return {
          date,
          label: Number.isNaN(d.getTime()) ? date.slice(8, 10) : String(d.getDate()),
          value,
          intensity,
          color: this.heatColor(intensity),
          dow: Number.isNaN(d.getTime()) ? 0 : d.getDay(),
        };
      });
  }
}
