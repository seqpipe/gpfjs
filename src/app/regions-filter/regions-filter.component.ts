import { RegionsFilter } from './regions-filter';
import { Component, OnInit, forwardRef } from '@angular/core';

import { Observable } from 'rxjs';
import { QueryStateProvider, QueryStateWithErrorsProvider } from '../query/query-state-provider';
import { toValidationObservable, validationErrorsToStringArray } from '../utils/to-observable-with-validation';
import { ValidationError } from 'class-validator';
import { StateRestoreService } from '../store/state-restore.service';

@Component({
  selector: 'gpf-regions-filter',
  templateUrl: './regions-filter.component.html',
  providers: [{provide: QueryStateProvider, useExisting: forwardRef(() => RegionsFilterComponent) }]
})
export class RegionsFilterComponent extends QueryStateWithErrorsProvider implements OnInit {

  regionsFilter = new RegionsFilter();

  constructor(
    private stateRestoreService: StateRestoreService
  ) {
    super();
  }

  ngOnInit() {
    this.stateRestoreService.getState(this.constructor.name)
      .take(1)
      .subscribe(state => {
        if (state['regions']) {
          this.regionsFilter.regionsFilter = state['regions'].join('\n');
        }
      });
  }


  getState() {
    return this.validateAndGetState(this.regionsFilter)
      .map(state => {
        let regionsFilter: string = state.regionsFilter;
        let result = regionsFilter
          .split(/[\s]/)
          .map(s => s.replace(/[,]/g, ''))
          .filter(s => s !== '');
        if (result.length === 0) {
          return {};
        }

        return { regions: result };
      });
  }

}
