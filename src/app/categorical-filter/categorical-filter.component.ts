import { Component, OnInit, Input } from '@angular/core';
import { toObservableWithValidation, validationErrorsToStringArray } from '../utils/to-observable-with-validation'
import { Store } from '@ngrx/store';
import {
  PhenoFiltersState, PHENO_FILTERS_ADD_CATEGORICAL,
  PHENO_FILTERS_CATEGORICAL_SET_SELECTION
} from '../pheno-filters/pheno-filters';
import { Observable } from 'rxjs/Observable';
import { ValidationError } from "class-validator";

@Component({
  selector: 'gpf-categorical-filter',
  templateUrl: './categorical-filter.component.html',
  styleUrls: ['./categorical-filter.component.css']
})
export class CategoricalFilterComponent implements OnInit {
  @Input() name: string;
  @Input() domain: Array<string>;

  constructor(
    private store: Store<any>
  ) { }

  ngOnInit() {
    this.store.dispatch({
      'type': PHENO_FILTERS_ADD_CATEGORICAL,
      'payload': this.name
    });
  }

  set selectedValue(value) {
    this.store.dispatch({
      'type': PHENO_FILTERS_CATEGORICAL_SET_SELECTION,
      'payload': {
        'id': this.name,
        'selection': [value]
      }
    });
  }

  get selectedValue(): string {
    return "";
  }

}
