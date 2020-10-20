import { Component, OnInit, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import * as d3 from 'd3';
import { Gene } from 'app/gene-view/gene';
import { GenotypePreviewVariantsArray, GenotypePreview } from 'app/genotype-preview-model/genotype-preview';
import { Subject, Observable } from 'rxjs';
import { DatasetsService } from 'app/datasets/datasets.service';
import { Transcript, Exon } from 'app/gene-view/gene';
import { FullscreenLoadingService } from 'app/fullscreen-loading/fullscreen-loading.service';


class GeneViewSummaryVariant {
  location: string;
  position: number;
  chrom: string;
  variant: string;
  effect: string;
  frequency: number;
  numberOfFamilyVariants: number;
  seenAsDenovo: boolean;

  seenInAffected: boolean;
  seenInUnaffected: boolean;
  svuid: string;

  lgds = ['nonsense', 'splice-site', 'frame-shift', 'no-frame-shift-new-stop'];

  static fromPreviewVariant(config, genotypePreview: GenotypePreview): GeneViewSummaryVariant {
    const result = new GeneViewSummaryVariant();
    const location = genotypePreview.get(config.locationColumn);
    result.location = location;
    result.position = Number(location.slice(location.indexOf(':') + 1));
    result.chrom = location.slice(0, location.indexOf(':'));

    let frequency: string = genotypePreview.data.get(config.frequencyColumn);
    if (frequency === '-') {
      frequency = '0.0';
    }
    result.frequency = Number(frequency);

    result.effect = genotypePreview.get(config.effectColumn).toLowerCase();
    result.variant = genotypePreview.get('variant.variant');

    result.numberOfFamilyVariants = 1;

    result.seenAsDenovo = false;
    if (genotypePreview.get('variant.is denovo')) {
      result.seenAsDenovo = true;
    }
    result.seenInAffected = false;
    result.seenInUnaffected = false;
    for (const pedigreeData of genotypePreview.get('genotype')) {
      if (pedigreeData.label > 0) {
        if (pedigreeData.color === '#ffffff') {
          result.seenInUnaffected = true;
        } else {
          result.seenInAffected = true;
        }
      }
    }

    result.svuid = result.location + ':' + result.variant;

    return result;
  }

  isLGDs(): boolean {
    if (this.lgds.indexOf(this.effect) !== -1 || this.effect === 'lgds') {
      return true;
    }
    return false;
  }

  isMissense(): boolean {
    if (this.effect === 'missense') {
      return true;
    }
    return false;
  }

  isSynonymous(): boolean {
    if (this.effect === 'synonymous') {
      return true;
    }
    return false;
  }
}

class GeneViewSummaryVariantsArray {
  summaryVariants: GeneViewSummaryVariant[] = [];

  constructor(summaryVariants: IterableIterator<GeneViewSummaryVariant>) {
    for (const summaryVariant of summaryVariants) {
      this.summaryVariants.push(summaryVariant);
    }
  }

  static fromPreviewVariantsArray(config, previewVariants: GenotypePreviewVariantsArray): GeneViewSummaryVariantsArray {
    const summaryVariants: Map<string, GeneViewSummaryVariant> = new Map();

    for (const genotypePreview of previewVariants.genotypePreviews) {
      const summaryVariant = GeneViewSummaryVariant.fromPreviewVariant(config, genotypePreview);
      const svuid = summaryVariant.svuid;

      if (!summaryVariants.has(svuid)) {
        summaryVariants.set(svuid, summaryVariant);
      } else {
        const mergeSummaryVariant = summaryVariants.get(svuid);
        mergeSummaryVariant.numberOfFamilyVariants += 1;
        if (summaryVariant.seenAsDenovo) {
          mergeSummaryVariant.seenAsDenovo = true;
        }
        if (summaryVariant.seenInAffected) {
          mergeSummaryVariant.seenInAffected = true;
        }
        if (summaryVariant.seenInUnaffected) {
          mergeSummaryVariant.seenInUnaffected = true;
        }
      }
    }
    return new GeneViewSummaryVariantsArray(summaryVariants.values());
  }
}

@Component({
  selector: 'gpf-gene-view',
  templateUrl: './gene-view.component.html',
  styleUrls: ['./gene-view.component.css']
})
export class GeneViewComponent implements OnInit {
  @Input() gene: Gene;
  @Input() variantsArray: GenotypePreviewVariantsArray;
  @Input() streamingFinished$: Subject<boolean>;
  @Output() updateShownTablePreviewVariantsArrayEvent = new EventEmitter<GenotypePreviewVariantsArray>();

  geneBrowserConfig;
  frequencyDomainMin: number;
  frequencyDomainMax: number;
  summaryVariantsArray: GeneViewSummaryVariantsArray;

  margin = { top: 10, right: 70, left: 70, bottom: 0 };
  y_axes_proportions = { domain: 0.70, subdomain: 0.20 };
  svgElement;
  svgWidth = 1200 - this.margin.left - this.margin.right;
  svgHeight;
  svgHeightFreqRaw = 400;
  svgHeightFreq = this.svgHeightFreqRaw - this.margin.top - this.margin.bottom;

  subdomainAxisY = Math.round(this.svgHeightFreq * 0.90);
  zeroAxisY = this.subdomainAxisY + Math.round(this.svgHeightFreq * 0.05);

  lgds = ['nonsense', 'splice-site', 'frame-shift', 'no-frame-shift-new-stop'];

  x;
  y;
  y_subdomain;
  y_zero;
  x_axis;
  y_axis;
  y_axis_subdomain;
  y_axis_zero;
  variantsDataRepr = [];
  selectedEffectTypes = ['lgds', 'missense', 'synonymous', 'other'];
  selectedAffectedStatus = ['Affected only', 'Unaffected only', 'Affected and unaffected'];
  selectedFrequencies;
  showDenovo = true;
  showTransmitted = true;

  brush;
  doubleClickTimer;
  geneTableStats = {
    geneSymbol: '',
    chromosome: '',
    totalFamilyVariants: 0,
    selectedFamilyVariants: 0,
    totalSummaryVariants: 0,
    selectedSummaryVariants: 0,
  };

  constructor(
    private datasetsService: DatasetsService,
    private loadingService: FullscreenLoadingService,
  ) { }

  ngOnInit() {
    this.datasetsService.getSelectedDataset().subscribe(dataset => {
      this.geneBrowserConfig = dataset.geneBrowser;
      this.frequencyDomainMin = this.geneBrowserConfig.domainMin;
      this.frequencyDomainMax = this.geneBrowserConfig.domainMax;
      this.selectedFrequencies = [0, this.frequencyDomainMax];

      this.drawEffectTypesIcons();
      this.drawTransmittedIcons();
      this.drawDenovoIcons();

      this.svgElement = d3.select('#svg-container')
        .append('svg')
        .attr('width', this.svgWidth + this.margin.left + this.margin.right)
        .attr('height', this.svgHeightFreqRaw)
        .append('g')
        .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

      this.x = d3.scaleLinear()
        .domain([0, 0])
        .range([0, this.svgWidth]);

      this.y = d3.scaleLog()
        .domain([this.frequencyDomainMin, this.frequencyDomainMax])
        .range([this.subdomainAxisY, 0]);

      this.y_subdomain = d3.scaleLinear()
        .domain([0, this.frequencyDomainMin])
        .range([this.zeroAxisY, this.subdomainAxisY]);

      this.y_zero = d3.scalePoint()
        .domain(['0'])
        .range([this.svgHeightFreq, this.zeroAxisY]);
    });
    this.streamingFinished$.subscribe(() => {
      this.summaryVariantsArray = GeneViewSummaryVariantsArray.fromPreviewVariantsArray(
        this.geneBrowserConfig,
        this.variantsArray
      );

      this.updateFamilyVariantsTable();
      this.drawPlot();

      this.geneTableStats.geneSymbol = this.gene.gene;
      this.geneTableStats.chromosome = this.gene.transcripts[0].chrom;
      this.geneTableStats.totalSummaryVariants = this.summaryVariantsArray.summaryVariants.length;
      this.geneTableStats.totalFamilyVariants = this.summaryVariantsArray.summaryVariants.reduce(
        (a, b) => a + b.numberOfFamilyVariants, 0
      );

      this.loadingService.setLoadingStop();
    });
  }

  ngOnChanges() {
    if (this.gene !== undefined) {
      this.resetGeneTableValues();
      this.setDefaultScale();
      this.drawGene();
    }
  }

  drawTransmittedIcons() {
    this.svgElement = d3.select('#transmitted')
    .attr('width', 80)
    .attr('height', 20);
    this.drawStar(10, 7.5, '#000000');
    this.drawTriangle(30, 8, '#000000');
    this.drawCircle(50, 8, '#000000');
    this.drawDot(70, 8, '#000000');
  }

  drawDenovoIcons() {
    this.svgElement = d3.select('#denovo')
    .attr('width', 80)
    .attr('height', 20);
    this.drawStar(10, 7.5, '#000000');
    this.drawSuroundingSquare(10, 7.5, '#000000');
    this.drawTriangle(30, 8, '#000000');
    this.drawSuroundingSquare(30, 8, '#000000');
    this.drawCircle(50, 8, '#000000');
    this.drawSuroundingSquare(50, 8, '#000000');
    this.drawDot(70, 8, '#000000');
    this.drawSuroundingSquare(70, 8, '#000000');
  }

  drawEffectTypesIcons() {
    this.svgElement = d3.select('#LGDs')
    .attr('width', 20)
    .attr('height', 20);
    this.drawStar(10, 7.5, '#000000');

    this.svgElement = d3.select('#Missense')
    .attr('width', 20)
    .attr('height', 20);
    this.drawTriangle(10, 8, '#000000');

    this.svgElement = d3.select('#Synonymous')
    .attr('width', 20)
    .attr('height', 20);
    this.drawCircle(10, 8, '#000000');

    this.svgElement = d3.select('#Other')
    .attr('width', 20)
    .attr('height', 20);
    this.drawDot(10, 8, '#000000');
  }

  checkShowDenovo(checked: boolean) {
    this.showDenovo = checked;

    if (this.gene !== undefined) {
      this.drawGene();
      this.drawPlot();
      this.updateFamilyVariantsTable();
    }
  }

  checkShowTransmitted(checked: boolean) {
    this.showTransmitted = checked;

    if (this.gene !== undefined) {
      this.drawGene();
      this.drawPlot();
      this.updateFamilyVariantsTable();
    }
  }

  checkEffectType(effectType: string, checked: boolean) {
    effectType = effectType.toLowerCase();
    if (checked) {
      this.selectedEffectTypes.push(effectType);
    } else {
      this.selectedEffectTypes.splice(this.selectedEffectTypes.indexOf(effectType), 1);
    }

    if (this.gene !== undefined) {
      this.drawGene();
      this.drawPlot();
      this.updateFamilyVariantsTable();
    }
  }

  checkAffectedStatus(affectedStatus: string, checked: boolean) {
    if (checked) {
      this.selectedAffectedStatus.push(affectedStatus);
    } else {
      this.selectedAffectedStatus.splice(this.selectedAffectedStatus.indexOf(affectedStatus), 1);
    }

    if (this.gene !== undefined) {
      this.drawGene();
      this.drawPlot();
      this.updateFamilyVariantsTable();
    }
  }

  isVariantEffectSelected(worst_effect) {
    worst_effect = worst_effect.toLowerCase();

    if (this.selectedEffectTypes.indexOf(worst_effect) !== -1) {
      return true;
    }

    if (this.lgds.indexOf(worst_effect) !== -1) {
      if (this.selectedEffectTypes.indexOf('lgds') !== -1) {
        return true;
      }
    } else if (worst_effect !== 'missense' && worst_effect !== 'synonymous' && this.selectedEffectTypes.indexOf('other') !== -1) {
      return true;
    }
    return false;
  }

  frequencyIsSelected(frequency: number) {
    return frequency >= this.selectedFrequencies[0] && frequency <= this.selectedFrequencies[1];
  }

  getAffectedStatusColor(affectedStatus: string): string {
    let color: string;

    if (affectedStatus === 'Affected only') {
      color = '#AA0000';
    } else if (affectedStatus === 'Unaffected only') {
      color = '#04613a';
    } else {
      color = '#8a8a8a';
    }

    return color;
  }

  getVariantAffectedStatus(summaryVariant: GeneViewSummaryVariant): string {
    let variantAffectedStatus: string;

    if (summaryVariant.seenInAffected) {
      if (summaryVariant.seenInUnaffected) {
        variantAffectedStatus = 'Affected and unaffected';
      } else {
        variantAffectedStatus = 'Affected only';
      }
    } else {
      variantAffectedStatus = 'Unaffected only';
    }

    return variantAffectedStatus;
  }

  isAffectedStatusSelected(affectedStatus: string): boolean {
    return this.selectedAffectedStatus.includes(affectedStatus) ? true : false;
  }

  filterSummaryVariantsArray(
    summaryVariantsArray: GeneViewSummaryVariantsArray, startPos: number, endPos: number
  ): GeneViewSummaryVariantsArray {
    const filteredVariants: GeneViewSummaryVariant[] = [];
    for (const summaryVariant of summaryVariantsArray.summaryVariants) {
      if (
        (!this.isVariantEffectSelected(summaryVariant.effect)) ||
        (!this.showDenovo && summaryVariant.seenAsDenovo) ||
        (!this.showTransmitted && !summaryVariant.seenAsDenovo) ||
        (!this.isAffectedStatusSelected(this.getVariantAffectedStatus(summaryVariant)))
      ) {
        continue;
      } else if (summaryVariant.position >= startPos && summaryVariant.position <= endPos) {
        if (this.frequencyIsSelected(summaryVariant.frequency)) {
          filteredVariants.push(summaryVariant);
        }
      }
    }
    return new GeneViewSummaryVariantsArray(filteredVariants.values());
  }

  filterTablePreviewVariantsArray(
    variantsArray: GenotypePreviewVariantsArray, startPos: number, endPos: number
  ): GenotypePreviewVariantsArray {
    const filteredVariants = [];
    const result = new GenotypePreviewVariantsArray();
    let location: string;
    let position: number;
    let frequency: string;
    for (const genotypePreview of variantsArray.genotypePreviews) {
      const data = genotypePreview.data;
      location = data.get(this.geneBrowserConfig.locationColumn);
      position = Number(location.slice(location.indexOf(':') + 1));
      frequency = data.get(this.geneBrowserConfig.frequencyColumn);
      if (
        (!this.isVariantEffectSelected(data.get(this.geneBrowserConfig.effectColumn))) ||
        (!this.showDenovo && data.get('variant.is denovo')) ||
        (!this.showTransmitted && !data.get('variant.is denovo')) ||
        (!this.isAffectedStatusSelected(this.getPedigreeAffectedStatus(data.get('genotype'))))
      ) {
        continue;
      } else if (position >= startPos && position <= endPos) {
        if (frequency === '-') {
          frequency = '0.0';
        }
        if (this.frequencyIsSelected(Number(frequency))) {
          filteredVariants.push(genotypePreview);
        }
      }
    }
    result.setGenotypePreviews(filteredVariants);
    return result;
  }

  getPedigreeAffectedStatus(pedigreeData): string {
    let result: string;
    let isInAffected = false;
    let isInUnaffected = false;

    for (const d of pedigreeData) {
      if (d.label > 0) {
        if (d.color === '#ffffff') {
          isInUnaffected = true;
        } else {
          isInAffected = true;
        }
      }
    }

    if (isInAffected && isInUnaffected) {
      result = 'Affected and unaffected';
    } else if (!isInAffected && isInUnaffected) {
      result = 'Unaffected only';
    } else {
      result = 'Affected only';
    }

    return result;
  }

  updateFamilyVariantsTable() {
    const filteredVariants = this.filterTablePreviewVariantsArray(
      this.variantsArray, this.x.domain()[0], this.x.domain()[1]
    );
    this.updateShownTablePreviewVariantsArrayEvent.emit(filteredVariants);
  }

  drawPlot() {
    const filteredSummaryVariants = this.filterSummaryVariantsArray(
      this.summaryVariantsArray, this.x.domain()[0], this.x.domain()[1]
    );
    this.geneTableStats.selectedSummaryVariants = filteredSummaryVariants.summaryVariants.length;
    this.geneTableStats.selectedFamilyVariants = filteredSummaryVariants.summaryVariants.reduce(
      (a, b) => a + b.numberOfFamilyVariants, 0
    );
      filteredSummaryVariants.summaryVariants[0].seenAsDenovo = true;
      filteredSummaryVariants.summaryVariants[5].seenAsDenovo = true;
      filteredSummaryVariants.summaryVariants[15].seenAsDenovo = true;
      filteredSummaryVariants.summaryVariants[20].seenAsDenovo = true;
      filteredSummaryVariants.summaryVariants[2].seenInUnaffected = true;
      filteredSummaryVariants.summaryVariants[9].seenInUnaffected = true;
      filteredSummaryVariants.summaryVariants[22].seenInUnaffected = true;
      filteredSummaryVariants.summaryVariants[43].seenInUnaffected = true;
      filteredSummaryVariants.summaryVariants[50].seenInUnaffected = true;
      filteredSummaryVariants.summaryVariants[50].seenInAffected = false;
      filteredSummaryVariants.summaryVariants[56].seenInAffected = false;
      filteredSummaryVariants.summaryVariants[56].seenInUnaffected = true;
      filteredSummaryVariants.summaryVariants[60].seenInAffected = false;
      filteredSummaryVariants.summaryVariants[60].seenInUnaffected = true;
      filteredSummaryVariants.summaryVariants[7].seenInAffected = false;
      filteredSummaryVariants.summaryVariants[7].seenInUnaffected = true;
      filteredSummaryVariants.summaryVariants[8].seenAsDenovo = true;
      filteredSummaryVariants.summaryVariants[8].seenInUnaffected = true;
      filteredSummaryVariants.summaryVariants[8].seenInAffected = false;
    if (this.gene !== undefined) {
      this.x_axis = d3.axisBottom(this.x).ticks(12);
      this.y_axis = d3.axisLeft(this.y);
      this.y_axis_subdomain = d3.axisLeft(this.y_subdomain).tickValues([this.frequencyDomainMin / 2.0]);
      this.y_axis_zero = d3.axisLeft(this.y_zero);
      this.svgElement.append('g').attr('transform', `translate(0, ${this.svgHeightFreq})`).call(this.x_axis);
      this.svgElement.append('g').call(this.y_axis);
      this.svgElement.append('g').call(this.y_axis_subdomain);
      this.svgElement.append('g').call(this.y_axis_zero);

      filteredSummaryVariants.summaryVariants.sort((a, b) => this.variantsComparator(a, b));

      for (const variant of filteredSummaryVariants.summaryVariants) {
        const color = this.getAffectedStatusColor(this.getVariantAffectedStatus(variant));

        if (variant.isLGDs()) {
          this.drawStar(this.x(variant.position), this.getVariantY(variant.frequency), color);
        } else if (variant.isMissense()) {
          this.drawTriangle(this.x(variant.position), this.getVariantY(variant.frequency), color);
        } else if (variant.isSynonymous()) {
          this.drawCircle(this.x(variant.position), this.getVariantY(variant.frequency), color);
        } else {
          this.drawDot(this.x(variant.position), this.getVariantY(variant.frequency), color);
        }
        if (variant.seenAsDenovo) {
          this.drawSuroundingSquare(this.x(variant.position), this.getVariantY(variant.frequency), color);
        }
      }
    }
  }

  variantsComparator(a: GeneViewSummaryVariant, b: GeneViewSummaryVariant) {
    if (a.seenAsDenovo && !b.seenAsDenovo) {
      return 1;
    } else if (!a.seenAsDenovo && b.seenAsDenovo) {
      return -1;
    } else {
      if (a.isLGDs() && !b.isLGDs()) {
        return 1;
      } else if (!a.isLGDs() && b.isLGDs()) {
        return -1;
      } else if (a.isMissense() && !b.isMissense()) {
        return 1;
      } else if (!a.isMissense() && b.isMissense()) {
        return -1;
      } else if (a.isSynonymous() && !b.isSynonymous()) {
        return 1;
      } else if (!a.isSynonymous() && b.isSynonymous()) {
        return -1;
      } else {
        if (this.getVariantAffectedStatus(a) === 'Affected only' && this.getVariantAffectedStatus(b) !== 'Affected only') {
          return 1;
        } else if (this.getVariantAffectedStatus(a) !== 'Affected only' && this.getVariantAffectedStatus(b) === 'Affected only') {
          return -1;
        } else if (this.getVariantAffectedStatus(a) === 'Unaffected only' && this.getVariantAffectedStatus(b) !== 'Unaffected only') {
          return 1;
        } else if (this.getVariantAffectedStatus(a) !== 'Unaffected only' && this.getVariantAffectedStatus(b) === 'Unaffected only') {
          return -1;
        } else {
          return 0;
        }
      }
    }
  }

  drawSuroundingSquare(x: number, y: number, color: string) {
    const w = 16;
    const h = 16;
    this.svgElement.append('g')
      .append('rect')
      .attr('x', x - w / 2)
      .attr('y', y - h / 2)
      .attr('width', w)
      .attr('height', h)
      .style('fill', color)
      .style('fill-opacity', 0.2)
      .style('stroke', color)
      .style('stroke-width', 2);
  }

  drawStar(x: number, y: number, color: string) {
    this.svgElement.append('svg')
    .attr('x', x - 8.5)
    .attr('y', y - 8.5)
    .append('g')
    .append('path')
    .attr('d', 'M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z')
    .attr('transform', 'scale(0.7)')
    .attr('fill', color)
    .attr('fill-opacity', '0.6')
    .style('stroke-width', 1)
    .style('stroke', color);
  }

  drawTriangle(x: number, y: number, color: string) {
    this.svgElement.append('g')
     .append('polygon')
     .attr('points', this.getTrianglePoints(x, y, 14))
     .style('fill', color)
     .attr('fill-opacity', '0.6')
     .style('stroke-width', 1)
     .style('stroke', color);
   }

  drawCircle(x: number, y: number, color: string) {
    this.svgElement.append('g')
    .append('circle')
    .attr('cx', x)
    .attr('cy', y)
    .attr('r', 7)
    .style('fill', color)
    .attr('fill-opacity', '0.6')
    .style('stroke-width', 1)
    .style('stroke', color);
  }

  drawDot(x: number, y: number, color: string) {
    this.svgElement.append('g')
    .append('circle')
    .attr('cx', x)
    .attr('cy', y)
    .attr('r', 3)
    .style('fill', color)
    .attr('fill-opacity', '0.6')
    .style('stroke-width', 1)
    .style('stroke', color);
  }

  getVariantY(variantFrequency): number {
    let y: number;

    if (variantFrequency === 0) {
      y = this.y_zero('0');
    } else if (variantFrequency < this.frequencyDomainMin) {
      y = this.y_subdomain(variantFrequency);
    } else {
      y = this.y(variantFrequency);
    }

    return y;
  }

  getTrianglePoints(plotX: number, plotY: number, size: number) {
    const height = Math.sqrt(Math.pow(size, 2) - Math.pow((size / 2.0), 2));
    const x1 = plotX - (size / 2.0);
    const y1 = plotY + (height / 2.0);
    const x2 = plotX + (size / 2.0);
    const y2 = plotY + (height / 2.0);
    const x3 = plotX;
    const y3 = plotY - (height / 2.0);
    return `${x1},${y1} ${x2},${y2} ${x3},${y3}`;
  }

  setDefaultScale() {
    let domainBeginning = this.gene.transcripts[0].exons[0].start;
    let domainEnding = this.gene.transcripts[0].exons[this.gene.transcripts[0].exons.length - 1].stop;

    let transcriptStart;
    let transcriptEnd;

    for (let i = 1; i < this.gene.transcripts.length; i++) {
      transcriptStart = this.gene.transcripts[i].exons[0].start;
      if (transcriptStart < domainBeginning) {
        domainBeginning = transcriptStart;
      }

      transcriptEnd = this.gene.transcripts[i].exons[this.gene.transcripts[i].exons.length - 1].stop;
      if (transcriptEnd > domainEnding) {
        domainEnding = transcriptEnd;
      }
    }

    this.x.domain([domainBeginning, domainEnding]);
    this.selectedFrequencies = [0, this.frequencyDomainMax];
  }

  resetGeneTableValues(): void {
    this.geneTableStats = {
      geneSymbol: '',
      chromosome: '',
      totalFamilyVariants: 0,
      selectedFamilyVariants: 0,
      totalSummaryVariants: 0,
      selectedSummaryVariants: 0,
    };
  }

  // GENE VIEW FUNCTIONS
  drawGene() {
    this.svgHeight = this.svgHeightFreqRaw + this.gene.transcripts.length * 50;
    d3.select('#svg-container').selectAll('svg').remove();

    this.svgElement = d3.select('#svg-container')
      .append('svg')
      .attr('width', this.svgWidth + this.margin.left + this.margin.right)
      .attr('height', this.svgHeight)
      .append('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    this.brush = d3.brush().extent([[0, 0], [this.svgWidth, this.svgHeightFreq]])
      .on('end', this.brushEndEvent);

    this.svgElement.append('g')
      .attr('class', 'brush')
      .call(this.brush);

    let transcriptYPosition = this.svgHeightFreqRaw + 20;
    for (let i = 0; i < this.gene.transcripts.length; i++) {
      this.drawTranscript(i, transcriptYPosition);
      transcriptYPosition += 50;
    }
  }

  brushEndEvent = () => {
    const extent = d3.event.selection;

    if (!extent) {
      if (!this.doubleClickTimer) {
        this.doubleClickTimer = setTimeout(this.resetTimer, 250);
        return;
      }
      this.setDefaultScale();
    } else {
      if (this.x.domain()[1] - this.x.domain()[0] > 12) {
        const newXmin = Math.round(this.x.invert(extent[0][0]));
        let newXmax = Math.round(this.x.invert(extent[1][0]));
        if (newXmax - newXmin < 12) {
          newXmax = newXmin + 12;
        }
        this.x.domain([newXmin, newXmax]);
        this.svgElement.select('.brush').call(this.brush.move, null);
      }

      // set new frequency limits
      const newFreqLimits = [
        this.convertBrushPointToFrequency(extent[0][1]),
        this.convertBrushPointToFrequency(extent[1][1])
      ];
      this.selectedFrequencies = [
        Math.min(...newFreqLimits),
        Math.max(...newFreqLimits),
      ];
    }

    this.drawGene();
    this.updateFamilyVariantsTable();
    this.drawPlot();
  }

  convertBrushPointToFrequency(brushY: number) {
    if (brushY < this.y_subdomain.range()[1]) {
      return this.y.invert(brushY);
    } else if (brushY < this.y_zero.range()[1]) {
      return this.y_subdomain.invert(brushY);
    } else {
      return 0;
    }
  }

  resetTimer = () => {
    this.doubleClickTimer = null;
  }

  getCDSTransitionPos(transcript: Transcript, exon: Exon) {
    function inCDS(pos: number) {
      return pos >= transcript.cds[0] && pos <= transcript.cds[1];
    }
    if (inCDS(exon.start) !== inCDS(exon.stop)) {
      if (inCDS(exon.start)) {
        return transcript.cds[1];
      } else {
        return transcript.cds[0];
      }
    } else { return null; }
  }

  isInCDS(transcript: Transcript, start: number, stop: number) {
    return (start >= transcript.cds[0]) && (stop <= transcript.cds[1]);
  }

  drawTranscript(transcriptId: number, yPos: number) {
    const transcript = this.gene.transcripts[transcriptId];
    const firstStart = transcript.exons[0].start;
    const strand = transcript.strand;
    const totalExonCount = transcript.exons.length;
    let lastEnd = null;
    let i = 1;
    for (const exon of transcript.exons) {

      const transitionPos = this.getCDSTransitionPos(transcript, exon);

      if (lastEnd) {
        this.drawIntron(lastEnd, exon.start, yPos, `intron ${i - 1}/${totalExonCount - 1}`);
      }

      if (transitionPos !== null) {
        this.drawExon(
          exon.start, transitionPos, yPos,
          `exon ${i}/${totalExonCount}`,
          this.isInCDS(transcript, exon.start, transitionPos)
        );
        this.drawExon(
          transitionPos, exon.stop, yPos,
          `exon ${i}/${totalExonCount}`,
          this.isInCDS(transcript, transitionPos, exon.stop)
        );
      } else {
        this.drawExon(
          exon.start, exon.stop, yPos,
          `exon ${i}/${totalExonCount}`,
          this.isInCDS(transcript, exon.start, exon.stop)
        );
      }

      lastEnd = exon.stop;
      i += 1;
    }

    this.drawTranscriptUTRText(firstStart, lastEnd, yPos, strand);
  }

  drawExon(xStart: number, xEnd: number, y: number, title: string, cds: boolean) {
    let rectThickness = 10;
    if (cds) {
      rectThickness = 15;
      y -= 2.5;
      title = title + ' [CDS]';
    }
    this.drawRect(xStart, xEnd, y, rectThickness, title);
  }

  drawIntron(xStart: number, xEnd: number, y: number, title: string) {
    this.drawLine(xStart, xEnd, y, title);
  }

  drawTranscriptUTRText(xStart: number, xEnd: number, y: number, strand: string) {
    const UTR = { left: '5\'', right: '3\'' };

    if (strand === '-') {
      UTR.left = '3\'';
      UTR.right = '5\'';
    }

    this.svgElement.append('text')
      .attr('y', y + 10)
      .attr('x', this.x(xStart) - 20)
      .attr('font-size', '13px')
      .text(UTR.left)
      .attr('cursor', 'default')
      .append('svg:title').text(`UTR ${UTR.left}`);

    this.svgElement.append('text')
      .attr('y', y + 10)
      .attr('x', this.x(xEnd) + 10)
      .attr('font-size', '13px')
      .text(UTR.right)
      .attr('cursor', 'default')
      .append('svg:title').text(`UTR ${UTR.right}`);
  }

  drawRect(xStart: number, xEnd: number, y: number, height: number, svgTitle: string) {
    const width = this.x(xEnd) - this.x(xStart);

    this.svgElement.append('rect')
      .attr('height', height)
      .attr('width', width)
      .attr('x', this.x(xStart))
      .attr('y', y)
      .attr('stroke', 'rgb(0,0,0)')
      .append('svg:title').text(svgTitle);
  }

  drawLine(xStart: number, xEnd: number, y: number, svgTitle: string) {
    const xStartAligned = this.x(xStart);
    const xEndAligned = this.x(xEnd);

    this.svgElement.append('line')
      .attr('x1', xStartAligned)
      .attr('y1', y + 5)
      .attr('x2', xEndAligned)
      .attr('y2', y + 5)
      .attr('stroke', 'black')
      .append('svg:title').text(svgTitle);
  }
}
