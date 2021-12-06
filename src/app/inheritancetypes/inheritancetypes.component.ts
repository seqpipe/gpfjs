import { Component, Input, OnChanges } from '@angular/core';
import { Validate } from 'class-validator';
import { SetNotEmpty } from '../utils/set.validators';
import { Store } from '@ngxs/store';
import { SetInheritanceTypes, InheritancetypesState } from './inheritancetypes.state';
import { StatefulComponent } from 'app/common/stateful-component';

@Component({
  selector: 'gpf-inheritancetypes',
  templateUrl: './inheritancetypes.component.html',
  styleUrls: ['./inheritancetypes.component.css'],
})
export class InheritancetypesComponent extends StatefulComponent implements OnChanges {

  @Input()
  inheritanceTypes: Set<string>;
  public inheritanceTypeDisplayNames: Map<string, string>;

  @Input()
  @Validate(SetNotEmpty, { message: 'Select at least one.' })
  selectedValues: Set<string> = new Set();

  constructor(protected store: Store) {
    super(store, InheritancetypesState, 'inheritanceTypes');
    this.inheritanceTypeDisplayNames = new Map();
    this.inheritanceTypeDisplayNames.set('reference', 'Reference');
    this.inheritanceTypeDisplayNames.set('mendelian', 'Mendelian');
    this.inheritanceTypeDisplayNames.set('denovo', 'Denovo');
    this.inheritanceTypeDisplayNames.set('possible_denovo', 'Possible denovo');
    this.inheritanceTypeDisplayNames.set('omission', 'Omission');
    this.inheritanceTypeDisplayNames.set('possible_omission', 'Possible omission');
    this.inheritanceTypeDisplayNames.set('other', 'Other');
    this.inheritanceTypeDisplayNames.set('missing', 'Missing');
    this.inheritanceTypeDisplayNames.set('unknown', 'Unknown');
  }

  ngOnChanges() {
    this.store.selectOnce(state => state.inheritancetypesState).subscribe(state => {
      // handle selected values input and/or restore state
      if (state.inheritanceTypes.length) {
        this.selectedValues = new Set(state.inheritanceTypes);
      } else {
        this.store.dispatch(new SetInheritanceTypes(this.selectedValues));
      }
    });
  }

  updateInheritanceTypes(newValues: Set<string>): void {
    this.selectedValues = newValues;
    this.store.dispatch(new SetInheritanceTypes(newValues));
  }
}
