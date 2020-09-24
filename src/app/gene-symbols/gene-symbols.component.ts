import { GeneSymbols } from './gene-symbols';
import { Component, OnInit, forwardRef } from '@angular/core';
import { Subject } from 'rxjs';

import { QueryStateProvider, QueryStateWithErrorsProvider } from '../query/query-state-provider';
import { GeneService } from '../gene-view/gene.service';
import { StateRestoreService } from '../store/state-restore.service';

@Component({
  selector: 'gpf-gene-symbols',
  templateUrl: './gene-symbols.component.html',
  providers: [{provide: QueryStateProvider, useExisting: forwardRef(() => GeneSymbolsComponent) }]
})
export class GeneSymbolsComponent extends QueryStateWithErrorsProvider implements OnInit {
  geneSymbols = new GeneSymbols();
  matchingGeneSymbols: string[] = [];
  searchString = '';
  searchKeystrokes$: Subject<string> = new Subject();

  constructor(
    private stateRestoreService: StateRestoreService,
    private geneService: GeneService
  ) {
    super();
  }

  ngOnInit() {
    this.stateRestoreService.getState(this.constructor.name)
      .take(1)
      .subscribe(state => {
        if (state['geneSymbols']) {
          this.geneSymbols.geneSymbols = state['geneSymbols'].join('\n');
        }
      });

    this.searchKeystrokes$
    .debounceTime(200)
    .distinctUntilChanged()
    .subscribe(searchTerm => {
      this.searchString = searchTerm;
      if (this.searchString !== '') {
        this.geneService.searchGenes(this.searchString).subscribe(
          response => this.matchingGeneSymbols = response['gene_symbols']
        );
      } else {
        this.matchingGeneSymbols = [];
      }
    });
  }

  getState() {
    return this.validateAndGetState(this.geneSymbols)
      .map(state => {
        const result = state.geneSymbols
          .split(/[,\s]/)
          .filter(s => s !== '')
          .map(s => s.toUpperCase());
        if (result.length === 0) {
          return {};
        }

        return { geneSymbols: result };
      });
  }

  searchBoxChange(searchTerm: string) {
    this.searchKeystrokes$.next(searchTerm.toUpperCase());
  }
}
