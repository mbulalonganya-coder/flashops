import { Component, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  SearchSelectComponent,
  SearchSelectOption,
} from '../search-select/search-select.component';

@Component({
  selector: 'app-agent-search',
  standalone: true,
  imports: [CommonModule, SearchSelectComponent],
  template: `
    <app-search-select
      #select
      [placeholder]="placeholder"
      emptyLabel="Tous les agents"
      [loader]="loadAgents"
      (selectedIdChange)="agentIdChange.emit($event)"
    />
  `,
})
export class AgentSearchComponent {
  private readonly api = inject(ApiService);

  @ViewChild('select') select?: SearchSelectComponent;

  @Input() placeholder = 'Rechercher un agent…';
  @Input() agencyId: number | null = null;
  @Output() agentIdChange = new EventEmitter<number | null>();

  loadAgents = (search: string, limit: number) =>
    this.api
      .getAgents({
        search: search || undefined,
        limit,
        agency_id: this.agencyId ?? undefined,
      })
      .pipe(
        map((res) =>
          res.data.map(
            (a): SearchSelectOption => ({
              id: a.id,
              label: a.name,
              hint: [a.agency_code, a.agency_name].filter(Boolean).join(' — ') || undefined,
            })
          )
        )
      );

  reset(): void {
    this.select?.reset();
  }
}
