import { Component, Output, EventEmitter } from '@angular/core';
import { Store } from '@ngrx/store';
import { QueryData, Rarity } from './query';
import { QueryService } from './query.service';
import { GenotypePreview, GenotypePreviewsArray } from '../genotype-preview-table/genotype-preview';
import { PresentInParentState } from '../present-in-parent/present-in-parent';

@Component({
  selector: 'gpf-query-submitter',
  templateUrl: './query-submitter.component.html'
})
export class QuerySubmitterComponent {
  @Output() genotypePreviewsArrayChange = new EventEmitter();

  constructor(
    private store: Store<any>,
    private queryService: QueryService
  ) { }


  submitQuery() {
    this.store.take(1).subscribe(s => this.prepareQuery(s));
  }

  private preparePresentInParent(presentInParentState: PresentInParentState): string[] {

    let presentInParent = new Array<string>();
    if (presentInParentState.fatherOnly) {
      presentInParent.push('father only');
    }
    if (presentInParentState.motherOnly) {
      presentInParent.push('mother only');
    }
    if (presentInParentState.motherFather) {
      presentInParent.push('mother and father');
    }
    if (presentInParentState.neither) {
      presentInParent.push('neither');
    }
    return presentInParent;
  }

  private prepareRarity(presentInParentState: PresentInParentState): Rarity {

    let rarity: Rarity = {
      ultraRare: presentInParentState.ultraRare,
      minFreq: presentInParentState.rarityIntervalStart,
      maxFreq: presentInParentState.rarityIntervalEnd
    };
    if (rarity.ultraRare) {
      rarity.minFreq = null;
      rarity.maxFreq = null;
    } else {
      rarity.ultraRare = null;
      if (rarity.minFreq <= 0.0) {
        rarity.minFreq = null;
      }
      if (rarity.maxFreq >= 100.0) {
        rarity.maxFreq = null;
      }
    }
    return rarity;
  }

  prepareQuery(state: any) {
    let queryData = new QueryData();
    let arrayToCommaSeparatedReduce = (acc, x, idx, source) => {
      return acc + ',' + x;
    };
    let trueFalseToCommaSeparated = (obj) => {
      let values = Array<string>();
      for (let key of Object.keys(obj)) {
        if (obj[key]) {
          values.push(key);
        }
      }
      return values;
    };

    queryData.datasetId = state.datasets.selectedDataset.id;
    queryData.effectTypes = state.effectTypes;
    queryData.gender = trueFalseToCommaSeparated(state.gender);
    queryData.variantTypes = trueFalseToCommaSeparated(state.variantTypes);
    queryData.presentInChild = state.presentInChild;

    queryData.pedigreeSelector = {
      id: state.pedigreeSelector.pedigree.id,
      checkedValues: state.pedigreeSelector.checkedValues
    };

    queryData.presentInParent = this.preparePresentInParent(state.presentInParent);
    queryData.rarity = this.prepareRarity(state.presentInParent);

    this.queryService.getGenotypePreviewByFilter(queryData).subscribe(
      (genotypePreviewsArray) => {
        this.genotypePreviewsArrayChange.emit(genotypePreviewsArray);
      });
  }
}
