import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateFr', standalone: true })
export class DateFrPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, withTime = true): string {
    if (!value) return '—';
    const date = typeof value === 'string' ? new Date(value) : value;
    const options: Intl.DateTimeFormatOptions = withTime
      ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Intl.DateTimeFormat('fr-FR', { ...options, timeZone: 'Africa/Kinshasa' }).format(date);
  }
}
