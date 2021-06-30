import { Component, OnInit } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { Equals, ValidateIf, Min, Max } from 'class-validator';
import { IsLessThanOrEqual } from '../utils/is-less-than-validator';
import { IsMoreThanOrEqual } from '../utils/is-more-than-validator';
import { Validate, validate } from 'class-validator';
import { SetNotEmpty } from '../utils/set.validators';
import { Observable } from 'rxjs';
import { SetPresentInParentValues, PresentInParentModel, PresentInParentState } from './present-in-parent.state';

@Component({
  selector: 'gpf-present-in-parent',
  templateUrl: './present-in-parent.component.html',
})
export class PresentInParentComponent implements OnInit {

  @ValidateIf(o => o.selectedRarityType !== 'ultraRare')
  @Min(0) @Max(100)
  @IsLessThanOrEqual('rarityIntervalEnd')
  rarityIntervalStart = 0;

  @ValidateIf(o => o.selectedRarityType !== 'ultraRare')
  @Min(0) @Max(100)
  rarityIntervalEnd = 100;

  presentInParentValues: Set<string> = new Set([
    'mother only', 'father only', 'mother and father', 'neither'
  ]);

  @Validate(SetNotEmpty, { message: 'select at least one' })
  selectedValues: Set<string> = new Set();

  rarityTypes: Set<string> = new Set([
    'ultraRare', 'interval', 'rare', 'all'
  ]);
  selectedRarityType = '';

  @Select(PresentInParentState) state$: Observable<PresentInParentModel>;
  errors: Array<string> = [];

  constructor(private store: Store) { }

  ngOnInit() {
    this.store.selectOnce(state => state.presentInParentState).subscribe(state => {
      // restore state
      this.selectedValues = new Set([...state.presentInParent]);
      this.selectedRarityType = state.rarityType;
      this.rarityIntervalStart = state.rarityIntervalStart;
      this.rarityIntervalEnd = state.rarityIntervalEnd;
    });

    this.state$.subscribe(state => {
      // validate for errors
      validate(this).then(errors => this.errors = errors.map(err => String(err)));
    });
  }

  updatePresentInParent(newValues: Set<string>): void {
    this.selectedValues = newValues;
    if (this.selectedValues.size === 1 && this.selectedValues.has('neither')) {
      // 'neither' does not allow for selecting a rarity type
      this.selectedRarityType = '';
    } else if (this.selectedRarityType === '') {
      // otherwise, set 'all' as default rarity type
      this.selectedRarityType = 'all';
    }
    this.updateState();
  }

  updateRarityIntervalStart(newValue: number): void {
    this.rarityIntervalStart = newValue;
    this.updateState();
  }

  updateRarityIntervalEnd(newValue: number): void {
    this.rarityIntervalEnd = newValue;
    this.updateState();
  }

  updateRarityType(newValue: string): void {
    this.selectedRarityType = newValue;
    if (this.selectedRarityType === 'rare') {
      this.rarityIntervalStart = 0;
    }
    this.updateState();
  }

  updateState(): void {
    this.store.dispatch(new SetPresentInParentValues(
      this.selectedValues, this.selectedRarityType,
      this.rarityIntervalStart, this.rarityIntervalEnd
    ));
  }
}
