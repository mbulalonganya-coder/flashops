import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(...registerables, zoomPlugin);

@Component({
  selector: 'app-chart-host',
  standalone: true,
  template: `<div class="chart-host" [style.height]="height"><canvas #canvas></canvas></div>`,
  styles: [
    `
      .chart-host {
        position: relative;
        width: 100%;
        min-height: 12rem;
      }
    `,
  ],
})
export class ChartHostComponent implements OnChanges, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() config: ChartConfiguration | null = null;
  /** CSS height of the chart area (e.g. 16rem, 240px). */
  @Input() height = '280px';
  /** Mouse wheel zoom (horizontal) + drag to pan when cursor is over the chart. */
  @Input() enableZoom = false;

  private chart?: Chart;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] || changes['enableZoom']) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(): void {
    this.chart?.destroy();
    if (!this.config) return;
    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config = this.withZoomOptions(this.config);
    this.chart = new Chart(ctx, config);
  }

  private withZoomOptions(config: ChartConfiguration): ChartConfiguration {
    if (!this.enableZoom) return config;

    const options = { ...(config.options ?? {}) };
    const plugins = { ...(options.plugins ?? {}) };
    plugins['zoom'] = {
      pan: {
        enabled: true,
        mode: 'x',
        modifierKey: 'shift',
      },
      zoom: {
        wheel: { enabled: true, speed: 0.08 },
        pinch: { enabled: true },
        drag: { enabled: false },
        mode: 'x',
      },
      limits: {
        x: { minRange: 3 },
      },
    };
    options.plugins = plugins;
    return { ...config, options };
  }
}
