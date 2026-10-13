import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyFr', standalone: true })
export class CurrencyFrPipe implements PipeTransform {
  transform(value: number | null | undefined, currency = 'USD'): string {
    if (value == null) return '—';
    const formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return `${formatted} ${currency}`;
  }
}
