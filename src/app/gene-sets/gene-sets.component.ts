import { ConfigService } from '../config/config.service';
import { GeneSetsLocalState } from './gene-sets-state';
import { Component, OnInit } from '@angular/core';
import { GeneSetsService } from './gene-sets.service';
import { GeneSetsCollection, GeneSet } from './gene-sets';
import { Subject, Observable, combineLatest, of } from 'rxjs';
import { DatasetsService } from 'app/datasets/datasets.service';
import { ValidateNested } from 'class-validator';
import { Store } from '@ngxs/store';
import { SetGeneSetsValues, GeneSetsState } from './gene-sets.state';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { StatefulComponent } from 'app/common/stateful-component';
import { environment } from 'environments/environment';

@Component({
  selector: 'gpf-gene-sets',
  templateUrl: './gene-sets.component.html',
  styleUrls: ['./gene-sets.component.css'],
})
export class GeneSetsComponent extends StatefulComponent implements OnInit {
  public geneSetsCollections: Array<GeneSetsCollection>;
  public geneSets: Array<GeneSet>;
  public searchQuery: string;
  public defaultSelectedDenovoGeneSetId: string[] = [];

  private geneSetsQueryChange = new Subject<[string, string, Object]>();
  private geneSetsResult: Observable<GeneSet[]>;

  private selectedDatasetId: string;
  public downloadUrl: string;

  public imgPathPrefix = environment.imgPathPrefix;

  @ValidateNested()
  private geneSetsLocalState = new GeneSetsLocalState();

  public constructor(
    protected store: Store,
    private config: ConfigService,
    private geneSetsService: GeneSetsService,
    private datasetService: DatasetsService,
  ) {
    super(store, GeneSetsState, 'geneSets');
  }

  public ngOnInit(): void {
    super.ngOnInit();

    this.selectedDatasetId = this.datasetService.getSelectedDataset().id;

    this.geneSetsService.getGeneSetsCollections().pipe(
      switchMap(geneSetsCollections => combineLatest(
        of(geneSetsCollections),
        this.store.selectOnce(state => state.geneSetsState),
      ))
    ).subscribe(([geneSetsCollections, state]) => {
      const denovoGeneSetTypes = geneSetsCollections.filter(
        geneSetCollection => geneSetCollection.name === 'denovo'
      )[0].types;

      if (!denovoGeneSetTypes.length) {
        geneSetsCollections = geneSetsCollections.filter(
          (geneSet) => geneSet.name.toLowerCase().trim() !== 'denovo'
        );
      } else {
        denovoGeneSetTypes.sort((a, b) => a.datasetName > b.datasetName ? 1 : b.datasetName > a.datasetName ? -1 : 0);

        const selectedStudyTypes = denovoGeneSetTypes.find(
          type => type.datasetId === this.selectedDatasetId
        ) || denovoGeneSetTypes[0];

        if (selectedStudyTypes) {
          this.defaultSelectedDenovoGeneSetId.push(selectedStudyTypes.datasetId +
            '-' + selectedStudyTypes.personSetCollectionId + '-denovo-geneset');
        }
      }
      this.geneSetsCollections = geneSetsCollections;
      this.selectedGeneSetsCollection = geneSetsCollections[0];
      this.restoreState(state);
    });

    this.geneSetsResult = this.geneSetsQueryChange.pipe(
      distinctUntilChanged(),
      debounceTime(300),
      switchMap(term => this.geneSetsService.getGeneSets(term[0], term[1], term[2])),
      catchError(error => {
        console.warn(error);
        return of(null);
      })
    );

    this.geneSetsResult.subscribe(geneSets => {
      this.geneSets = geneSets.sort((a, b) => a.name.localeCompare(b.name));
      this.store.selectOnce(state => state.geneSetsState).subscribe((state) => {
        if (!state.geneSet || !state.geneSet.geneSet) {
          return;
        }
        for (const geneSet of this.geneSets) {
          if (geneSet.name === state.geneSet.geneSet) {
            this.geneSetsLocalState.geneSet = geneSet;
          }
        }
      });
    });
  }

  private restoreState(state): void {
    if (state.geneSet && state.geneSetsCollection) {
      for (const geneSetCollection of this.geneSetsCollections) {
        if (geneSetCollection.name === state.geneSetsCollection.name) {
          this.selectedGeneSetsCollection = geneSetCollection;
          this.selectedGeneSet = state.geneSet;
          if (state.geneSetsTypes) {
            this.restoreGeneTypes(state.geneSetsTypes, geneSetCollection);
          }
          this.onSearch();
        }
      }
    } else {
      this.onSearch();
    }
  }

  private restoreGeneTypes(geneSetsTypes, geneSetCollection: GeneSetsCollection): void {
    const geneTypes = geneSetCollection.types
      .filter(geneType => geneType.datasetId in geneSetsTypes &&
              geneType.personSetCollectionId in geneSetsTypes[geneType.datasetId]);
    if (geneTypes.length !== 0) {
      this.geneSetsLocalState.geneSetsTypes = Object.create(null);
      for (const geneType of geneTypes) {
        const datasetId = geneType.datasetId;
        const personSetCollectionId = geneType.personSetCollectionId;
        for (const personSet of geneType.personSetCollectionLegend) {
          if (geneSetsTypes[datasetId][personSetCollectionId].indexOf(personSet.id) > -1) {
            const denovoGeneSetId = `${datasetId}-${personSetCollectionId}-denovo-geneset`;
            if (!this.defaultSelectedDenovoGeneSetId.includes(denovoGeneSetId)) {
              this.defaultSelectedDenovoGeneSetId.push(denovoGeneSetId);
            }
            this.geneSetsLocalState.select(datasetId, personSetCollectionId, personSet.id);
          }
        }
      }
    }
  }

  public onSearch(searchTerm = ''): number {
    if (!this.selectedGeneSetsCollection) {
      return;
    }

    this.searchQuery = searchTerm;

    if (this.geneSets) {
      this.geneSets = this.geneSets.filter(
        (value) => value.name.indexOf(searchTerm) >= 0 || value.desc.indexOf(searchTerm) >= 0
      );
    }

    this.geneSetsQueryChange.next(
      [this.selectedGeneSetsCollection.name, searchTerm, this.geneSetsLocalState.geneSetsTypes]
    );
  }

  public onSelect(event: GeneSet): void {
    this.selectedGeneSet = event;
    if (event === null) {
      this.onSearch();
    }
  }

  public isSelectedGeneType(datasetId: string, personSetCollectionId: string, geneType: string): boolean {
    return this.geneSetsLocalState.isSelected(datasetId, personSetCollectionId, geneType);
  }

  public setSelectedGeneType(datasetId: string, personSetCollectionId: string, geneType: string, value: boolean): void {
    this.selectedGeneSet = null;
    if (value) {
      this.geneSetsLocalState.select(datasetId, personSetCollectionId, geneType);
    } else {
      this.geneSetsLocalState.deselect(datasetId, personSetCollectionId, geneType);
    }
  }

  public get selectedGeneSetsCollection(): GeneSetsCollection {
    return this.geneSetsLocalState.geneSetsCollection;
  }

  public set selectedGeneSetsCollection(selectedGeneSetsCollection: GeneSetsCollection) {
    this.geneSetsLocalState.geneSetsCollection = selectedGeneSetsCollection;
    this.geneSetsLocalState.geneSet = null;
    this.geneSetsLocalState.geneSetsTypes = Object.create(null);
    this.geneSets = [];

    if (selectedGeneSetsCollection.types.length > 0) {
      const geneSetType = selectedGeneSetsCollection.types.find(
        genesetType => genesetType.datasetId === this.selectedDatasetId
      ) || selectedGeneSetsCollection.types[0];

      this.setSelectedGeneType(
        geneSetType.datasetId, geneSetType.personSetCollectionId, geneSetType.personSetCollectionLegend[0].id, true
      );
    }

    this.onSearch();
  }

  public get selectedGeneSet(): GeneSet {
    return this.geneSetsLocalState.geneSet;
  }

  public set selectedGeneSet(geneSet) {
    this.geneSetsLocalState.geneSet = geneSet;
    this.downloadUrl = this.getDownloadUrl(geneSet);
    this.store.dispatch(new SetGeneSetsValues(this.geneSetsLocalState));
  }

  private getDownloadUrl(selectedGeneSet: GeneSet): string {
    if (!selectedGeneSet) {
      return;
    }

    return `${this.config.baseUrl}${selectedGeneSet.download}`;
  }
}
