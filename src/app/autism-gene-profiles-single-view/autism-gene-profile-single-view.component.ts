import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import {
  AgpDatasetPersonSet, AgpDatasetStatistic, AgpGene,
  AgpGenomicScores, AgpSingleViewConfig, AgpEffectType
} from 'app/autism-gene-profiles-single-view/autism-gene-profile-single-view';
// eslint-disable-next-line no-restricted-imports
import { Observable, of, zip } from 'rxjs';
import { GeneWeightsService } from '../gene-weights/gene-weights.service';
import { GeneWeights } from 'app/gene-weights/gene-weights';
import { AutismGeneProfilesService } from 'app/autism-gene-profiles-block/autism-gene-profiles.service';
import { switchMap, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { GeneService } from 'app/gene-browser/gene.service';
import { Gene } from 'app/gene-browser/gene';
import { DatasetsService } from 'app/datasets/datasets.service';
import { Store } from '@ngxs/store';
import { QueryService } from 'app/query/query.service';
import { GenomicScore } from 'app/genotype-browser/genotype-browser';
import { SetEffectTypes } from 'app/effect-types/effect-types.state';
import { SetGeneSymbols } from 'app/gene-symbols/gene-symbols.state';
import { SetGenomicScores } from 'app/genomic-scores-block/genomic-scores-block.state';
import { SetPedigreeSelector } from 'app/pedigree-selector/pedigree-selector.state';
import { SetPresentInChildValues } from 'app/present-in-child/present-in-child.state';
import { SetPresentInParentValues } from 'app/present-in-parent/present-in-parent.state';
import { SetStudyTypes } from 'app/study-types/study-types.state';
import { SetVariantTypes } from 'app/variant-types/variant-types.state';
import { EffectTypes } from 'app/effect-types/effect-types';
import {trigger, state, style, animate, transition} from '@angular/animations';

@Component({
  selector: 'gpf-autism-gene-profile-single-view',
  templateUrl: './autism-gene-profile-single-view.component.html',
  styleUrls: ['./autism-gene-profile-single-view.component.css']
})
export class AutismGeneProfileSingleViewComponent implements OnInit {
  @Input() public readonly geneSymbol: string;
  @Input() public config: AgpSingleViewConfig;
  @Input() public isInGeneCompare = false;
  public showTemplate = true;

  public genomicScoresGeneWeights = [];
  public gene$: Observable<AgpGene>;

  public _histogramOptions = {
    width: 525,
    height: 110,
    marginLeft: 50,
    marginTop: 25
  };

  public isGeneInSFARI = false;
  public links = {
    GeneBrowser: '',
    UCSC: '',
    GeneCards: '',
    Pubmed: '',
    SFARIgene: ''
  };

  currentCopyState: string = 'assets/link-solid.svg'; 

  public constructor(
    private autismGeneProfilesService: AutismGeneProfilesService,
    private geneWeightsService: GeneWeightsService,
    private geneService: GeneService,
    private datasetsService: DatasetsService,
    private location: Location,
    private router: Router,
    private queryService: QueryService,
    private store: Store
  ) { }

  private contentState: {
    error: string,
    status: boolean
  };

  private errorModal: boolean = false;

  public ngOnInit(): void {
    this.contentState = {
      error: '',
      status: false
    };

    this.gene$ = this.autismGeneProfilesService.getGene(this.geneSymbol);
    this.gene$.pipe(
      switchMap(gene => {
        gene.geneSets.forEach(element => {
          if (element.match(/sfari/i)) {
            this.isGeneInSFARI = true;
          } 
        });

        let scores: string;
        const geneWeightsObservables = [];
        for (let i = 0; i < gene.genomicScores.length; i++) {
          scores = [...gene.genomicScores[i].scores.map(score => score.id)].join(',');
          geneWeightsObservables.push(
            this.geneWeightsService.getGeneWeights(scores)
          );
        }
        zip(...geneWeightsObservables).subscribe(geneWeightsArray => {
          for (let k = 0; k < geneWeightsArray.length; k++) {
            this.genomicScoresGeneWeights.push({
              category: gene.genomicScores[k].id,
              scores: geneWeightsArray[k]
            });
          }
        });
        return this.geneService.getGene(this.geneSymbol);
      }),
      switchMap(gene => zip(of(gene), this.datasetsService.getDataset(this.config.defaultDataset)))
    ).subscribe(([gene, dataset]) => {
      this.setLinks(this.geneSymbol, gene, dataset.genome);
    }, (error) => {
      this.contentState = {
        error: this.geneSymbol + ' is not found in the genome!',
        status: true
      };
      this.errorModal = true;
    });
  }

  public setLinks(geneSymbol: string, gene: Gene, datasetGenome: string): void {
    this.links.GeneBrowser = this.getGeneBrowserLink();
    this.links.UCSC = this.getUCSCLink(gene, datasetGenome);
    this.links.GeneCards = 'https://www.genecards.org/cgi-bin/carddisp.pl?gene=' + geneSymbol;
    this.links.Pubmed = 'https://pubmed.ncbi.nlm.nih.gov/?term=' + geneSymbol + '%20AND%20(autism%20OR%20asd)';

    if (this.isGeneInSFARI) {
      this.links.SFARIgene = 'https://gene.sfari.org/database/human-gene/' + geneSymbol;
    }
  }

  public getUCSCLink(gene: Gene, datasetGenome: string): string {
    const genome: string = datasetGenome;
    const chromosomePrefix: string = genome === 'hg38' ? '' : 'chr';
    const chromosome: string = gene.transcripts[0].chromosome;
    const geneStartPosition: number = gene.transcripts[0].start;
    const geneStopPosition: number = gene.transcripts[gene.transcripts.length - 1].stop;

    // eslint-disable-next-line max-len
    return `https://genome.ucsc.edu/cgi-bin/hgTracks?db=${ genome }&position=${ chromosomePrefix }${ chromosome }%3A${ geneStartPosition }-${ geneStopPosition }`;
  }

  public getGeneBrowserLink(): string {
    if (!this.config) {
      return;
    }

    const dataset = this.config.defaultDataset;
    let pathname = this.router.createUrlTree(['datasets', dataset, 'gene-browser', this.geneSymbol]).toString();
    pathname = this.location.prepareExternalUrl(pathname);
    return window.location.origin + pathname;
  }

  public getGeneWeightByKey(category: string, key: string): GeneWeights {
    return this.genomicScoresGeneWeights
      .find(genomicScoresCategory => genomicScoresCategory.category === category).scores
      .find(score => score.weight === key);
  }

  public getSingleScoreValue(genomicScores: AgpGenomicScores[], categoryId: string, scoreId: string): number {
    return genomicScores.find(category => category.id === categoryId).scores.find(score => score.id === scoreId).value;
  }

  public getGeneDatasetValue(gene: AgpGene, studyId: string, personSetId: string, statisticId: string): AgpEffectType {
    return gene.studies.find(study => study.id === studyId).personSets
      .find(genePersonSet => genePersonSet.id === personSetId).effectTypes
      .find(effectType => effectType.id === statisticId);
  }

  public get histogramOptions() {
    return this._histogramOptions;
  }

  public goToQuery(
    geneSymbol: string, personSet: AgpDatasetPersonSet, datasetId: string, statistic: AgpDatasetStatistic
  ): void {
    AutismGeneProfileSingleViewComponent.goToQuery(
      this.store, this.queryService, geneSymbol, personSet, datasetId, statistic
    );
  }

  public static goToQuery(
    store: Store, queryService: QueryService, geneSymbol: string,
    personSet: AgpDatasetPersonSet, datasetId: string, statistic: AgpDatasetStatistic
  ): void {
    const effectTypes = {
      lgds: EffectTypes['LGDS'],
      intron: ['Intron'],
      missense: ['Missense'],
    };
    const newWindow = window.open('', '_blank');

    const genomicScores: GenomicScore[] = [];
    if (statistic.scores) {
      genomicScores[0] = new GenomicScore(
        statistic.scores[0]['name'],
        statistic.scores[0]['min'],
        statistic.scores[0]['max'],
      );
    }

    const presentInChildValues = ['proband only', 'proband and sibling', 'sibling only'];
    const presentInParentRareValues = ['father only', 'mother only', 'mother and father'];

    let presentInParent: string[] = ['neither'];
    let rarityType = 'all';
    if (statistic.category === 'rare') {
      rarityType = 'rare';
      presentInParent = presentInParentRareValues;
    }

    store.dispatch([
      new SetGeneSymbols([geneSymbol]),
      new SetEffectTypes(new Set(effectTypes[statistic['effects'][0]])),
      new SetStudyTypes(new Set(['we'])),
      new SetVariantTypes(new Set(statistic['variantTypes'])),
      new SetGenomicScores(genomicScores),
      new SetPresentInChildValues(new Set(presentInChildValues)),
      new SetPresentInParentValues(new Set(presentInParent), rarityType, 0, 1),
      new SetPedigreeSelector(personSet.collectionId, new Set([personSet.id])),
    ]);

    store.selectOnce(state => state).subscribe(state => {
      state['datasetId'] = datasetId;
      queryService.saveQuery(state, 'genotype')
      .pipe(take(1))
      .subscribe(urlObject => {
        const url = queryService.getLoadUrlFromResponse(urlObject);
        newWindow.location.assign(url);
      });
    });
  }

  public copyGeneLink() {
    let currentUrl = window.location.href;
    if(!currentUrl.endsWith(this.geneSymbol)) {
      currentUrl += (currentUrl.endsWith('/') ? '' : '/') + this.geneSymbol;
    }
    this.copyToClipboard(currentUrl);
    this.currentCopyState = 'assets/check-solid.svg';
  }

  copyToClipboard(item) {
    document.addEventListener('copy', (e: ClipboardEvent) => {
      e.clipboardData.setData('text/plain', (item));
      e.preventDefault();
      document.removeEventListener('copy', null);
    });
    document.execCommand('copy');
  }
}