import { Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import {
  GeneProfilesDatasetPersonSet, GeneProfilesDatasetStatistic, GeneProfilesGene,
  GeneProfilesGenomicScores, GeneProfilesSingleViewConfig, GeneProfilesEffectType
} from 'app/gene-profiles-single-view/gene-profiles-single-view';
// eslint-disable-next-line no-restricted-imports
import { Observable, of, zip } from 'rxjs';
import { GeneScoresService } from '../gene-scores/gene-scores.service';
import { GeneScores } from 'app/gene-scores/gene-scores';
import { GeneProfilesService } from 'app/gene-profiles-block/gene-profiles.service';
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

@Component({
  selector: 'gpf-gene-profiles-single-view',
  templateUrl: './gene-profiles-single-view.component.html',
  styleUrls: ['./gene-profiles-single-view.component.css']
})
export class GeneProfileSingleViewComponent implements OnInit {
  @ViewChild('stickySpan', {static: false}) public menuElement: ElementRef;
  @ViewChild('wrapperElement') public wrapperElement: ElementRef;

  @Input() public readonly geneSymbol: string;
  @Input() public config: GeneProfilesSingleViewConfig;
  @Input() public isInGeneCompare = false;
  public showTemplate = true;

  public genomicScoresGeneScores: {category: string; scores: GeneScores[]}[] = [];
  public gene$: Observable<GeneProfilesGene>;

  public histogramOptions = {
    width: 525,
    height: 110,
    marginLeft: 50,
    marginTop: 25
  };

  public isGeneInSFARI = false;
  public links = {
    geneBrowser: '',
    ucsc: '',
    geneCards: '',
    pubmed: '',
    sfariGene: ''
  };

  private headerBottomYPosition = 116;
  public isHeaderSticky: boolean;

  public constructor(
    private geneProfilesService: GeneProfilesService,
    private geneScoresService: GeneScoresService,
    private geneService: GeneService,
    private datasetsService: DatasetsService,
    private location: Location,
    private router: Router,
    private queryService: QueryService,
    private store: Store
  ) { }

  public errorModal = false;

  @HostListener('window:scroll', ['$event'])
  public handleScroll(): void {
    if (this.isInGeneCompare) {
      if (window.pageYOffset >= this.headerBottomYPosition) {
        this.isHeaderSticky = true;
      } else {
        this.isHeaderSticky = false;
      }
    }
  }

  public ngOnInit(): void {
    this.gene$ = this.geneProfilesService.getGene(this.geneSymbol);
    this.gene$.pipe(
      switchMap(gene => {
        gene.geneSets.forEach(element => {
          if (element.match(/sfari/i)) {
            this.isGeneInSFARI = true;
          }
        });

        let scores: string;
        const geneScoresObservables: Observable<GeneScores[]>[] = [];
        for (const genomicScore of gene.genomicScores) {
          scores = [...genomicScore.scores.map(score => score.id)].join(',');
          geneScoresObservables.push(
            this.geneScoresService.getGeneScores(scores)
          );
        }
        zip(...geneScoresObservables).subscribe(geneScoresArray => {
          for (let k = 0; k < geneScoresArray.length; k++) {
            this.genomicScoresGeneScores.push({
              category: gene.genomicScores[k].id,
              scores: geneScoresArray[k]
            });
          }
        });
        return this.geneService.getGene(this.geneSymbol);
      }),
      switchMap(gene => zip(of(gene), this.datasetsService.getDataset(this.config.defaultDataset)))
    ).subscribe(([gene, dataset]) => {
      this.setLinks(this.geneSymbol, gene, dataset.genome);
    }, () => {
      this.errorModal = true;
    });
  }

  public setLinks(geneSymbol: string, gene: Gene, datasetGenome: string): void {
    this.links.geneBrowser = this.getGeneBrowserLink();
    this.links.ucsc = this.getUCSCLink(gene, datasetGenome);
    this.links.geneCards = 'https://www.genecards.org/cgi-bin/carddisp.pl?gene=' + geneSymbol;
    this.links.pubmed = 'https://pubmed.ncbi.nlm.nih.gov/?term=' + geneSymbol + '%20AND%20(autism%20OR%20asd)';

    if (this.isGeneInSFARI) {
      this.links.sfariGene = 'https://gene.sfari.org/database/human-gene/' + geneSymbol;
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

  public getGeneScoreByKey(category: string, key: string): GeneScores {
    return this.genomicScoresGeneScores
      .find(genomicScoresCategory => genomicScoresCategory.category === category).scores
      .find(score => score.score === key);
  }

  public getSingleScoreValue(genomicScores: GeneProfilesGenomicScores[], categoryId: string, scoreId: string): number {
    return genomicScores.find(category => category.id === categoryId).scores.find(score => score.id === scoreId).value;
  }

  public getGeneDatasetValue(gene: GeneProfilesGene, studyId: string, personSetId: string, statisticId: string): GeneProfilesEffectType {
    return gene.studies.find(study => study.id === studyId).personSets
      .find(genePersonSet => genePersonSet.id === personSetId).effectTypes
      .find(effectType => effectType.id === statisticId);
  }

  public goToQuery(
    geneSymbol: string, personSet: GeneProfilesDatasetPersonSet, datasetId: string, statistic: GeneProfilesDatasetStatistic
  ): void {
    GeneProfileSingleViewComponent.goToQuery(
      this.store, this.queryService, geneSymbol, personSet, datasetId, statistic
    );
  }

  public static goToQuery(
    store: Store, queryService: QueryService, geneSymbol: string, personSet: GeneProfilesDatasetPersonSet,
    datasetId: string, statistic: GeneProfilesDatasetStatistic, newTab: boolean = true
  ): void {
    const effectTypes = {
      lgds: EffectTypes['LGDS'],
      intron: ['intron'],
      missense: ['missense'],
      synonymous: ['synonymous'],
    };

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

          if (newTab) {
            const newWindow = window.open('', '_blank');
            newWindow.location.assign(url);
          } else {
            window.location.assign(url);
          }
        });
    });
  }

  public errorModalBack(): void {
    this.errorModal = false;
    this.router.navigate(['/gene-profiles']);
  }
}
