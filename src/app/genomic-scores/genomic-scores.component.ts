import { Component, Input } from '@angular/core';
import { GenomicScores } from '../genomic-scores-block/genomic-scores-block';

import 'rxjs/add/operator/filter';

import { GenomicScoreState } from './genomic-scores-store';

import { ReplaySubject } from 'rxjs/ReplaySubject';

@Component({
  selector: 'gpf-genomic-scores',
  templateUrl: './genomic-scores.component.html',
})
export class GenomicScoresComponent {
  @Input() index: number;
  @Input() genomicScoreState: GenomicScoreState;
  @Input() errors: string[];
  @Input() genomicScoresArray: GenomicScores[];

  private rangeChanges = new ReplaySubject<[string, number, number]>(1);

  set rangeStart(range: number) {
    this.genomicScoreState.rangeStart = range;
  }

  get rangeStart() {
    return this.genomicScoreState.rangeStart;
  }

  set rangeEnd(range: number) {
    this.genomicScoreState.rangeEnd = range;
  }

  get rangeEnd() {
    return this.genomicScoreState.rangeEnd;
  }

  get domainMin() {
    return this.genomicScoreState.domainMin;
  }

  get domainMax() {
    return this.genomicScoreState.domainMax;
  }

  private updateLabels() {
    this.rangeChanges.next([
      this.genomicScoreState.score.score,
      this.genomicScoreState.rangeStart,
      this.genomicScoreState.rangeEnd
    ]);
  }

  set selectedGenomicScores(selectedGenomicScores: GenomicScores) {
    this.genomicScoreState.score = selectedGenomicScores;
    this.genomicScoreState.rangeStart = null;
    this.genomicScoreState.rangeEnd = null;
    this.genomicScoreState.changeDomain(selectedGenomicScores);
    this.updateLabels();
  }

  get selectedGenomicScores() {
    return this.genomicScoreState.score;
  }
}
