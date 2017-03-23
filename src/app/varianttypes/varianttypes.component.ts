import { DatasetsState } from '../datasets/datasets';
import {
  VariantTypesState, VARIANT_TYPES_INIT,
  VARIANT_TYPES_SET,
  VARIANT_TYPES_UNCHECK, VARIANT_TYPES_CHECK
} from './varianttypes';
import { Component, OnInit, forwardRef } from '@angular/core';

import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { QueryStateProvider } from '../query/query-state-provider'
import { QueryData } from '../query/query'
import { toObservableWithValidation, validationErrorsToStringArray } from '../utils/to-observable-with-validation'
import { ValidationError } from "class-validator";

@Component({
  selector: 'gpf-varianttypes',
  templateUrl: './varianttypes.component.html',
  styleUrls: ['./varianttypes.component.css'],
  providers: [{provide: QueryStateProvider, useExisting: forwardRef(() => VarianttypesComponent) }]
})
export class VarianttypesComponent extends QueryStateProvider implements OnInit {
  sub: boolean = true;
  ins: boolean = true;
  del: boolean = true;
  CNV: boolean = true;

  variantTypesState: Observable<[VariantTypesState, boolean, ValidationError[]]>;
  hasCNV: boolean = false;

  private errors: string[];
  private flashingAlert = false;

  constructor(
    private store: Store<any>
  ) {
    super();
    this.variantTypesState = toObservableWithValidation(VariantTypesState, this.store.select('variantTypes'));

    let datasetsState: Observable<DatasetsState> = this.store.select('datasets');
    datasetsState.subscribe(state => {
      if (!state || !state.selectedDataset) {
        this.hasCNV = false;
        this.selectAll();
        return;
      }
      this.hasCNV = state.selectedDataset.genotypeBrowser.hasCNV;
      this.selectAll();
    });

  }

  ngOnInit() {
    this.variantTypesState.subscribe(
      ([variantTypesState, isValid, validationErrors]) => {
        this.errors = validationErrorsToStringArray(validationErrors);

        this.sub = variantTypesState.selected.indexOf('sub') !== -1;
        this.ins = variantTypesState.selected.indexOf('ins') !== -1;
        this.del = variantTypesState.selected.indexOf('del') !== -1;
        this.CNV = variantTypesState.selected.indexOf('CNV') !== -1;
      }
    );
  }

  selectAll(): void {
    let payload = ['sub', 'ins', 'del'];
    if (this.hasCNV) {
      console.log(this.hasCNV);
      payload.push('CNV');
    }
    this.store.dispatch({
      'type': VARIANT_TYPES_SET,
      'payload': payload
    });
  }

  selectNone(): void {
    this.store.dispatch({
      'type': VARIANT_TYPES_SET,
      'payload': []
    });
  }

  variantTypesCheckValue(variantType: string, value: boolean): void {
    if (variantType === 'sub' || variantType === 'ins' || variantType === 'del' || variantType === 'CNV') {
      this.store.dispatch({
        'type': value ? VARIANT_TYPES_CHECK : VARIANT_TYPES_UNCHECK,
        'payload': variantType
      });
    }
  }

  getState() {
    return this.variantTypesState.take(1).map(
      ([variantTypes, isValid, validationErrors]) => {
        if (!isValid) {
          this.flashingAlert = true;
          setTimeout(()=>{ this.flashingAlert = false }, 1000)

          throw "invalid state"
        }
        return { variantTypes: variantTypes.selected }
    });
  }
}
