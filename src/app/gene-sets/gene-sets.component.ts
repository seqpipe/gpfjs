import { ConfigService } from '../config/config.service';
import {
  GeneSetsState, GENE_SETS_INIT, GENE_SETS_COLLECTION_CHANGE,
  GENE_SETS_TYPES_CLEAR,  GENE_SET_CHANGE,
  GENE_SETS_TYPES_ADD, GENE_SETS_TYPES_REMOVE
} from './gene-sets-state';
import { Component, OnInit, forwardRef } from '@angular/core';
import { GeneSetsService } from './gene-sets.service';
import { GeneSetsCollection, GeneSet } from './gene-sets';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { toObservableWithValidation, validationErrorsToStringArray } from '../utils/to-observable-with-validation'
import { ValidationError } from "class-validator";
import { QueryStateProvider } from '../query/query-state-provider'
import { StateRestoreService } from '../store/state-restore.service'

@Component({
  selector: 'gpf-gene-sets',
  templateUrl: './gene-sets.component.html',
  styleUrls: ['./gene-sets.component.css'],
  providers: [{provide: QueryStateProvider, useExisting: forwardRef(() => GeneSetsComponent) }]
})
export class GeneSetsComponent extends QueryStateProvider implements OnInit {
  geneSetsCollections: Array<GeneSetsCollection>;
  geneSets: Array<GeneSet>;
  private internalSelectedGeneSetsCollection: GeneSetsCollection;
  selectedGeneSet: GeneSet;
  private searchQuery: string;
  private geneSetsTypes: Set<any>;
  private geneSetsState: Observable<[GeneSetsState, boolean, ValidationError[]]>;

  private geneSetsQueryChange = new Subject<[string, string, Array<string>]>();
  private geneSetsResult: Observable<GeneSet[]>;

  errors: string[];
  flashingAlert = false;

  constructor(
    private geneSetsService: GeneSetsService,
    private store: Store<any>,
    private config: ConfigService,
    private stateRestoreService: StateRestoreService
  ) {
    super();
    this.geneSetsState = toObservableWithValidation(GeneSetsState, this.store.select('geneSets'));
  }


  isGeneSetsTypesUpdated(geneSetsTypes: Set<any>): boolean {
    if (!this.geneSetsTypes && geneSetsTypes) return true;
    if (this.geneSetsTypes && !geneSetsTypes) return true;
    if (this.geneSetsTypes.size !== geneSetsTypes.size) return true;
    for (var a in this.geneSetsTypes) {
      if (!geneSetsTypes.has(a)) return true;
    }

    return false;
  }

  restoreStateSubscribe() {
    this.stateRestoreService.getState(this.constructor.name).subscribe(
      (state) => {
        if (state['geneSet'] && state['geneSet']['geneSetsCollection']) {
          for (let geneSetCollection of this.geneSetsCollections) {
            if (geneSetCollection.name == state['geneSet']['geneSetsCollection']) {
              this.store.dispatch({
                'type': GENE_SETS_COLLECTION_CHANGE,
                'payload': geneSetCollection
              });

              if (state['geneSet']['geneSetsTypes']) {
                this.restoreGeneTypes(state['geneSet']['geneSetsTypes'], geneSetCollection);
              }
            }
          }
        }
      }
    )
  }

  restoreGeneTypes(state, geneSetCollection: GeneSetsCollection) {
    this.store.dispatch({
      'type': GENE_SETS_TYPES_CLEAR
    });

    for (let geneType of geneSetCollection.types) {
      for (let restoredGeneType of state) {
        if (geneType.name == restoredGeneType) {
          this.store.dispatch({
            'type': GENE_SETS_TYPES_ADD,
            'payload': geneType
          });
        }
      }
    }
  }

  ngOnInit() {
    this.store.dispatch({
      'type': GENE_SETS_INIT,
    });

    this.geneSetsState.subscribe(
      ([geneSets, isValid, validationErrors])  => {
        if (geneSets == null) {
          return;
        }
        this.errors = validationErrorsToStringArray(validationErrors);

        let refreshData = false;

        if (this.internalSelectedGeneSetsCollection !== geneSets.geneSetsCollection) {
          this.internalSelectedGeneSetsCollection = geneSets.geneSetsCollection;
          this.geneSets = null;
          this.searchQuery = '';
          refreshData = true;
        }
        this.selectedGeneSet = geneSets.geneSet;

        if (this.isGeneSetsTypesUpdated(geneSets.geneSetsTypes)) {
          this.geneSetsTypes = geneSets.geneSetsTypes;

          if (this.internalSelectedGeneSetsCollection
            && this.internalSelectedGeneSetsCollection.types.length  > 0
            && geneSets.geneSetsTypes.size == 0) {

            this.geneSets = null;
            refreshData = false;
            this.errors.push("Select at least one gene type");
          }
          else {
            refreshData = true;
          }
        }

        if (refreshData) {
          this.onSearch(this.searchQuery);
        }
      }
    );

    this.geneSetsService.getGeneSetsCollections().subscribe(
      (geneSetsCollections) => {
        this.geneSetsCollections = geneSetsCollections;
        this.selectedGeneSetsCollection = geneSetsCollections[0];
        this.restoreStateSubscribe();
      }
    );

    this.geneSetsResult = this.geneSetsQueryChange
      .debounceTime(1000)
      .distinctUntilChanged()
      .switchMap(term => {
        return this.geneSetsService.getGeneSets(term[0], term[1], term[2]);
      })
      .catch(error => {
        console.log(error);
        return null;
      });

    this.geneSetsResult.subscribe(
      (geneSets) => {
        this.geneSets = geneSets.sort((a, b) => a.name.localeCompare(b.name));
        this.stateRestoreService.getState(this.constructor.name + "geneSet").subscribe(
          (state) => {
            if (state['geneSet'] && state['geneSet']['geneSet']) {
              for (let geneSet of this.geneSets) {
                if (geneSet.name == state['geneSet']['geneSet']) {
                  this.store.dispatch({
                    'type': GENE_SET_CHANGE,
                    'payload': geneSet
                  });
                }
              }
            }
          }
        )
      });
  }

  onSearch(searchTerm: string) {
    if (!this.selectedGeneSetsCollection) {
      return;
    }

    let geneSetsTypesNames = new Array<string>();
    this.geneSetsTypes.forEach((value) => {
      geneSetsTypesNames.push(value.id);
    });

    this.searchQuery = searchTerm;

    if (this.geneSets) {
      this.geneSets = this.geneSets.filter(
        (value) => {
          return value.name.indexOf(searchTerm) >= 0 ||
                 value.desc.indexOf(searchTerm) >= 0;
        }
      )
    }

    this.geneSetsQueryChange.next(
      [this.selectedGeneSetsCollection.name, searchTerm, geneSetsTypesNames]);
  }

  onSelect(event: GeneSet) {
    this.store.dispatch({
      'type': GENE_SET_CHANGE,
      'payload': event
    });

    if (event == null) {
      this.onSearch('');
    }
  }

  isSelectedGeneType(geneType): boolean {
    return this.geneSetsTypes.has(geneType);
  }

  setSelectedGeneType(geneType, value) {
    this.store.dispatch({
      'type': value ? GENE_SETS_TYPES_ADD : GENE_SETS_TYPES_REMOVE,
      'payload': geneType
    });
  }

  get selectedGeneSetsCollection(): GeneSetsCollection {
    return this.internalSelectedGeneSetsCollection;
  }

  set selectedGeneSetsCollection(selectedGeneSetsCollection: GeneSetsCollection) {
    this.store.dispatch({
      'type': GENE_SETS_COLLECTION_CHANGE,
      'payload': selectedGeneSetsCollection
    });

    if (selectedGeneSetsCollection.types.length > 0) {
      this.setSelectedGeneType(selectedGeneSetsCollection.types[0], true);
    }
  }

  getDownloadLink(selectedGeneSet: GeneSet): string {
    return `${this.config.baseUrl}${selectedGeneSet.download}`;
  }

  getState() {
    return this.geneSetsState.take(1).map(
      ([geneSetsState, isValid, validationErrors]) => {
        if (!isValid) {
          this.flashingAlert = true;
          setTimeout(()=>{ this.flashingAlert = false }, 1000)

          throw "invalid state"
        }

        let geneSetsTypes = Array.from(geneSetsState.geneSetsTypes).map(t => t.id);
        return { geneSet :{
          geneSetsCollection: geneSetsState.geneSetsCollection.name,
          geneSet: geneSetsState.geneSet.name,
          geneSetsTypes: geneSetsTypes
        }};
    });
  }
}
