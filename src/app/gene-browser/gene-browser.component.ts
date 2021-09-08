import { Component, HostListener, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Store } from '@ngxs/store';
import { GeneService } from 'app/gene-browser/gene.service';
import { Gene } from 'app/gene-browser/gene';
import { SummaryAllelesArray, SummaryAllelesFilter, codingEffectTypes,
  affectedStatusValues, effectTypeValues, variantTypeValues } from 'app/gene-browser/summary-variants';
import { GenotypePreviewVariantsArray } from 'app/genotype-preview-model/genotype-preview';
import { QueryService } from 'app/query/query.service';
import { first } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Dataset } from 'app/datasets/datasets';
import { DatasetsService } from 'app/datasets/datasets.service';
import { FullscreenLoadingService } from 'app/fullscreen-loading/fullscreen-loading.service';
import { GenePlotComponent } from 'app/gene-plot/gene-plot.component';
import { ConfigService } from 'app/config/config.service';
import { clone } from 'lodash';
import * as d3 from 'd3';
import * as draw from 'app/utils/svg-drawing';

@Component({
  selector: 'gpf-gene-browser',
  templateUrl: './gene-browser.component.html',
  styleUrls: ['./gene-browser.component.css'],
})
export class GeneBrowserComponent implements OnInit, OnDestroy {
  @ViewChild(GenePlotComponent) private genePlotComponent: GenePlotComponent;
  private selectedGene: Gene;
  private geneSymbol = '';
  private maxFamilyVariants = 1000;
  public selectedDataset: Dataset;
  private selectedDatasetId: string;
  private loadingFinished: boolean;
  private familyLoadingFinished: boolean;
  private showError = false;
  private geneBrowserConfig;
  private legendDrawn = false;
  private subscriptions: Subscription[] = [];

  public readonly affectedStatusValues = affectedStatusValues;
  public readonly effectTypeValues = effectTypeValues;
  public readonly variantTypeValues = variantTypeValues;

  private genotypePreviewVariantsArray: GenotypePreviewVariantsArray;
  private summaryVariantsArray: SummaryAllelesArray;
  private summaryVariantsArrayFiltered: SummaryAllelesArray;
  private summaryVariantsFilter: SummaryAllelesFilter = new SummaryAllelesFilter();

  private selectedFrequencies: [number, number] = [0, 0];
  private selectedRegion: [number, number] = [0, 0];

  @HostListener('document:keydown.enter', ['$event'])
  private onEnterPress($event) {
    if ($event.target.id === 'search-box') {
      this.submitGeneRequest();
    }
  }

  @ViewChild('filters', { static: false }) public set filters(element) {
    this.drawDenovoIcons();
    this.drawTransmittedIcons();
    this.drawEffectTypesIcons();
  }

  constructor(
    readonly configService: ConfigService,
    private route: ActivatedRoute,
    private store: Store,
    private queryService: QueryService,
    private geneService: GeneService,
    private datasetsService: DatasetsService,
    private loadingService: FullscreenLoadingService,
  ) { }

  public ngOnInit(): void {
    this.selectedDataset = this.datasetsService.getSelectedDataset();
    if (this.selectedDataset) {
      this.geneBrowserConfig = this.selectedDataset.geneBrowser;
    }

    this.subscriptions.push(
      this.datasetsService.getDatasetsLoadedObservable().subscribe(datasetsLoaded => {
        this.selectedDataset = this.datasetsService.getSelectedDataset();
        if (this.selectedDataset) {
          this.geneBrowserConfig = this.selectedDataset.geneBrowser;
          if (this.route.snapshot.params.gene && this.selectedDataset.accessRights) {
            this.submitGeneRequest(this.route.snapshot.params.gene);
          }
        }
      }),
      this.queryService.streamingFinishedSubject.subscribe(() => {
        this.familyLoadingFinished = true;
      }),
      this.queryService.summaryStreamingFinishedSubject.subscribe(async() => {
        this.loadingFinished = true;
        this.loadingService.setLoadingStop();
      }),
      this.route.parent.params.subscribe(
        (params: Params) => {
          this.selectedDatasetId = params['dataset'];
        }
      ),
      this.store.select(state => state.geneSymbolsState).subscribe(state => {
        if (state.geneSymbols.length) {
          this.geneSymbol = state.geneSymbols[0];
        }
      })
    );
  }

  public ngOnDestroy(): void {
    this.subscriptions.map(subscription => subscription.unsubscribe());
  }

  private async submitGeneRequest(geneSymbol?: string) {
    this.showError = false;
    if (geneSymbol) {
      this.geneSymbol = geneSymbol.toUpperCase().trim();
    }
    if (!this.geneSymbol) {
      return;
    }
    try {
      this.selectedGene = await this.geneService.getGene(
        this.geneSymbol.toUpperCase().trim()
      ).pipe(first()).toPromise();
    } catch (error) {
      console.error(error);
      this.showError = true;
      return;
    }
    this.loadingFinished = false;
    this.loadingService.setLoadingStart();
    this.genotypePreviewVariantsArray = null;

    const requestParams = {
      'datasetId': this.selectedDatasetId,
      'geneSymbols': [this.geneSymbol.toUpperCase().trim()],
      'maxVariantsCount': 10000,
      'inheritanceTypeFilter': ['denovo', 'mendelian', 'omission', 'missing'],
    };
    if (this.summaryVariantsFilter.codingOnly) {
      requestParams['effectTypes'] = codingEffectTypes;
    }
    this.summaryVariantsArray = this.queryService.getSummaryVariants(requestParams);
    this.summaryVariantsArrayFiltered = clone(this.summaryVariantsArray);

    this.summaryVariantsFilter.selectedRegion = [
      this.selectedGene.collapsedTranscript.start,
      this.selectedGene.collapsedTranscript.stop
    ];
    this.summaryVariantsFilter.selectedFrequencies = [
      0, this.geneBrowserConfig.domainMax
    ];

    this.updateShownTablePreviewVariantsArray();

    if (!this.summaryVariantsFilter.codingOnly) {
      await this.waitForGenePlotComponent();
      this.genePlotComponent.toggleCondenseIntrons();
    }
  }

  private async waitForGenePlotComponent() {
    return new Promise<void>(resolve => {
      const timer = setInterval(() => {
        if (this.genePlotComponent !== undefined) {
          resolve();
          clearInterval(timer);
        }
      }, 100);
    });
  }

  private get requestParams(): object {
    return {
      ...this.summaryVariantsFilter.queryParams,
      'geneSymbols': [this.selectedGene.geneSymbol],
      'datasetId': this.selectedDatasetId,
      'regions': this.selectedGene.getRegionString(...this.summaryVariantsFilter.selectedRegion),
      'summaryVariantIds': this.summaryVariantsArrayFiltered.summaryAlleleIds.reduce(
        (a, b) => a.concat(b), []
      ),
      'genomicScores': [{
        'metric': this.geneBrowserConfig.frequencyColumn,
        'rangeStart': this.summaryVariantsFilter.minFreq,
        'rangeEnd': this.summaryVariantsFilter.maxFreq,
      }],
    };
  }

  private updateShownTablePreviewVariantsArray() {
    this.familyLoadingFinished = false;
    const requestParams = {
      ...this.requestParams,
      'maxVariantsCount': this.maxFamilyVariants,
      'uniqueFamilyVariants': false,
    };
    this.genotypePreviewVariantsArray = this.queryService.getGenotypePreviewVariantsByFilter(
      this.selectedDataset, requestParams
    );
  }

  private onSubmit(event) {
    const targetId = event.target.attributes.id.nodeValue;

    const requestParams = {
      ...this.requestParams,
      'download': true,
    };

    if (targetId === 'summary_download') {
      requestParams['querySummary'] = true;
    }

    event.target.queryData.value = JSON.stringify(requestParams);
    event.target.submit();
  }

  private updateVariants(): void {
    this.summaryVariantsArrayFiltered = this.summaryVariantsFilter.filterSummaryVariantsArray(
      this.summaryVariantsArray
    );
    this.updateShownTablePreviewVariantsArray();
  }

  public checkAffectedStatus(affectedStatus: string, value: boolean): void {
    value ? this.summaryVariantsFilter.selectedAffectedStatus.add(affectedStatus)
          : this.summaryVariantsFilter.selectedAffectedStatus.delete(affectedStatus);
    this.updateVariants();
  }

  public checkEffectType(effectType: string, value: boolean): void {
    effectType = effectType.toLowerCase();
    value ? this.summaryVariantsFilter.selectedEffectTypes.add(effectType)
          : this.summaryVariantsFilter.selectedEffectTypes.delete(effectType);
    this.updateVariants();
  }

  public checkVariantType(variantType: string, value: boolean): void {
    variantType = variantType.toLowerCase();
    value ? this.summaryVariantsFilter.selectedVariantTypes.add(variantType)
          : this.summaryVariantsFilter.selectedVariantTypes.delete(variantType);
    this.updateVariants();
  }

  public checkShowDenovo(value: boolean): void {
    this.summaryVariantsFilter.denovo = value;
    this.updateVariants();
  }

  public checkShowTransmitted(value: boolean): void {
    this.summaryVariantsFilter.transmitted = value;
    this.updateVariants();
  }

  public setSelectedRegion(region: [number, number]): void {
    this.summaryVariantsFilter.selectedRegion = region;
    this.updateVariants();
  }

  public setSelectedFrequencies(frequencies: [number, number]): void {
    this.summaryVariantsFilter.selectedFrequencies = frequencies;
    this.updateVariants();
  }

  public getAffectedStatusColor(affectedStatus: string): string {
    return draw.affectedStatusColors[affectedStatus];
  }

  private drawDenovoIcons() {
    const svgElement = d3.select('#denovo');
    draw.surroundingRectangle(svgElement, 10, 7.5, '#000000', 'Denovo LGDs');
    draw.star(svgElement, 10, 7.5, '#000000', 'Denovo LGDs');
    draw.surroundingRectangle(svgElement, 30, 8, '#000000', 'Denovo Missense');
    draw.triangle(svgElement, 30, 8, '#000000', 'Denovo Missense');
    draw.surroundingRectangle(svgElement, 50, 8, '#000000', 'Denovo Synonymous');
    draw.circle(svgElement, 50, 8, '#000000', 'Denovo Synonymous');
    draw.surroundingRectangle(svgElement, 70, 8, '#000000', 'Denovo Other');
    draw.dot(svgElement, 70, 8, '#000000', 'Denovo Other');
    draw.surroundingRectangle(svgElement, 90, 8, '#000000', 'Denovo CNV+');
    draw.rect(svgElement, 82, 98, 5, 6, '#000000', 0.4, 'Denovo CNV+');
    draw.surroundingRectangle(svgElement, 110, 8, '#000000', 'Denovo CNV-');
    draw.rect(svgElement, 102, 118, 7.5, 1, '#000000', 0.4, 'Denovo CNV-');
  }

  private drawTransmittedIcons() {
    const svgElement = d3.select('#transmitted');
    draw.star(svgElement, 10, 7.5, '#000000', 'LGDs');
    draw.triangle(svgElement, 30, 8, '#000000', 'Missense');
    draw.circle(svgElement, 50, 8, '#000000', 'Synonymous');
    draw.dot(svgElement, 70, 8, '#000000', 'Other');
    draw.rect(svgElement, 82, 98, 5, 6, '#000000', 0.4, 'CNV+');
    draw.rect(svgElement, 107, 125, 7.5, 1, '#000000', 0.4, 'CNV-');
  }

  private drawEffectTypesIcons() {
    const effectIcons = {
      '#LGDs': draw.star,
      '#Missense': draw.triangle,
      '#Synonymous': draw.circle,
      '#Other': draw.dot
    };
    let svgElement;
    for (const [effect, drawFunc] of Object.entries(effectIcons)) {
      svgElement = d3.select(effect);
      drawFunc(svgElement, 10, 8, '#000000', effect);
    }
    svgElement = d3.select('#CNV\\+');
    draw.rect(svgElement, 5, 20, 5, 6, '#000000', 0.4, 'CNV+');
    svgElement = d3.select('#CNV-');
    draw.rect(svgElement, 5, 20, 7.5, 1, '#000000', 0.4, 'CNV-');
  }
}
