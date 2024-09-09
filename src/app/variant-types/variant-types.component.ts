import { Input, Component, OnChanges, OnInit } from '@angular/core';
import { Validate } from 'class-validator';
import { SetNotEmpty } from '../utils/set.validators';
import { Store } from '@ngrx/store';
import { selectVariantTypes, setVariantTypes } from './variant-types.state';
import { StatefulComponent } from 'app/common/stateful-component';
import { take } from 'rxjs';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'gpf-variant-types',
  templateUrl: './variant-types.component.html'
})
export class VariantTypesComponent extends StatefulComponent implements OnInit {
  @Input() public variantTypes: Set<string> = new Set<string>([]);

  @Input()
  @Validate(SetNotEmpty, {message: 'Select at least one.'})
  public selectedVariantTypes: Set<string> = new Set();

  public constructor(protected store: Store) {
    super(store, 'variantTypes', selectVariantTypes);
  }

  public ngOnInit(): void {
    super.ngOnInit();

    // this.store.select(selectVariantTypes).pipe(take(1)).subscribe(variantTypes => {
    this.store.select(selectVariantTypes).pipe(take(1)).subscribe(variantTypesState => {
      if (!variantTypesState) {
        this.selectedVariantTypes = cloneDeep(this.variantTypes);
        this.store.dispatch(setVariantTypes({variantTypes: [...this.selectedVariantTypes]}))
        return;
      }
      this.selectedVariantTypes = new Set(variantTypesState);
    });
  }

  public updateVariantTypes(newValues: Set<string>): void {
    this.selectedVariantTypes = newValues;
    this.store.dispatch(setVariantTypes({ variantTypes: [...newValues] }));
  }
}
