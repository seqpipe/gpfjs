import { Component, OnInit, ViewChild } from '@angular/core';
import { GeneService } from 'app/gene-view/gene.service';
import { Gene } from 'app/gene-view/gene';
import { GenotypePreviewVariantsArray, GenotypePreviewInfo } from 'app/genotype-preview-model/genotype-preview';
import { QueryService } from 'app/query/query.service';
import { Observable } from 'rxjs';
import { Dataset } from 'app/datasets/datasets';
import { DatasetsService } from 'app/datasets/datasets.service';
import { ActivatedRoute, Params } from '@angular/router';
import { QueryStateCollector } from 'app/query/query-state-provider';
import { FullscreenLoadingService } from 'app/fullscreen-loading/fullscreen-loading.service';
import { GeneViewComponent } from 'app/gene-view/gene-view.component';

@Component({
  selector: 'gpf-gene-browser-component',
  templateUrl: './gene-browser.component.html',
  styleUrls: ['./gene-browser.component.css'],
  providers: [{
    provide: QueryStateCollector,
    useExisting: GeneBrowserComponent
  }]
})
export class GeneBrowserComponent extends QueryStateCollector implements OnInit {
  selectedGene: Gene;
  geneSymbol = 'CHD8';
  genotypePreviewVariantsArray: GenotypePreviewVariantsArray;
  shownTablePreviewVariantsArray: GenotypePreviewVariantsArray;
  selectedDataset$: Observable<Dataset>;
  selectedDatasetId: string;
  genotypePreviewInfo: GenotypePreviewInfo;
  loadingFinished: boolean;
  codingEffectTypes = [
    'Nonsense', 'Frame-shift', 'Splice-site',
    'No-frame-shift-newStop', 'Missense',
    'No-frame-shift', 'noStart', 'noEnd', 'Synonymous'
  ];

  enableCodingOnly: boolean;
  private genotypeBrowserState: Object;

  constructor(
    public queryService: QueryService,
    private geneService: GeneService,
    private datasetsService: DatasetsService,
    private route: ActivatedRoute,
    private loadingService: FullscreenLoadingService

  ) {
    super();
  }

  ngOnInit() {
    this.selectedDataset$ = this.datasetsService.getSelectedDataset();

    this.route.parent.params.subscribe(
      (params: Params) => {
        this.selectedDatasetId = params['dataset'];
      }
     );
  }

  getCurrentState() {
    const state = super.getCurrentState();
    return state.map(current_state => {
      const stateObject = Object.assign({ datasetId: this.selectedDatasetId }, current_state);
      return stateObject;
    });
  }

  updateShownTablePreviewVariantsArray($event: GenotypePreviewVariantsArray) {
    this.shownTablePreviewVariantsArray = $event;
  }

  submitGeneRequest() {
    this.updateShownTablePreviewVariantsArray(new GenotypePreviewVariantsArray());

    this.getCurrentState()
      .subscribe(state => {
        this.geneSymbol = state["geneSymbols"][0];

        this.geneService.getGene(this.geneSymbol.toUpperCase().trim()).subscribe((gene) => {
          this.selectedGene = gene;
        });

        this.genotypePreviewInfo = null;
        this.loadingFinished = false;
        this.loadingService.setLoadingStart();
        this.queryService.getGenotypePreviewInfo(
          { datasetId: this.selectedDatasetId, peopleGroup: state["peopleGroup"] }
        ).subscribe(
          (genotypePreviewInfo) => {
            this.genotypePreviewInfo = genotypePreviewInfo;
            this.genotypePreviewVariantsArray = null;

            this.genotypeBrowserState = state;

            this.queryService.streamingFinishedSubject.subscribe(
              _ => { this.loadingFinished = true; }
            );

            const requestParams = {...state};
            requestParams['maxVariantsCount'] = 10000;

            if (this.enableCodingOnly) {
              requestParams['effectTypes'] = this.codingEffectTypes;
            }

            this.genotypePreviewVariantsArray =
              this.queryService.getGenotypePreviewVariantsByFilter(requestParams, this.genotypePreviewInfo);

          }, error => {
            console.warn(error);
          }
        );
      }, error => {
        console.error(error);
      });
  }
}
