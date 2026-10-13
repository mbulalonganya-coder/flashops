import { Component, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { formatAgencyLabel } from '../../utils/format.utils';
import {
  SearchSelectComponent,
  SearchSelectOption,
} from '../search-select/search-select.component';

@Component({
  selector: 'app-agency-search-select',
  standalone: true,
  imports: [CommonModule, SearchSelectComponent],
  template: `
    <app-search-select
      #select
      [placeholder]="placeholder"
      [emptyLabel]="emptyLabel"
      [loader]="loadAgencies"
      (selectedIdChange)="agencyIdChange.emit($event)"
    />
  `,
})
export class AgencySearchSelectComponent {
  private readonly api = inject(ApiService);

  @ViewChild('select') select?: SearchSelectComponent;

  @Input() placeholder = 'Rechercher une agence…';
  @Input() emptyLabel = 'Toutes les agences';
  @Output() agencyIdChange = new EventEmitter<number | null>();

  loadAgencies = (search: string, limit: number) =>
    this.api.getAgencies({ search: search || undefined, limit, page: 1 }).pipe(
      map((res) =>
        res.data.map(
          (a): SearchSelectOption => ({
            id: a.id,
            label: formatAgencyLabel(a, { includeCode: true }),
            hint: a.category_label || a.category_code,
          })
        )
      )
    );

  reset(): void {
    this.select?.reset();
  }
}
