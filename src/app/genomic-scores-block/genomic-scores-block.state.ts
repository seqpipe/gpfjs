import { createReducer, createAction, on, props, createFeatureSelector } from '@ngrx/store';
import { reset } from 'app/users/state-actions';
import { cloneDeep } from 'lodash';
import { CategoricalHistogramView } from './genomic-scores-block';
import { HistogramType } from 'app/gene-scores/gene-scores.state';

export interface GenomicScoreState {
  histogramType: HistogramType;
  score: string;
  rangeStart: number;
  rangeEnd: number;
  values: string[];
  categoricalView: CategoricalHistogramView;
}

export const initialState: GenomicScoreState[] = [];


export const selectGenomicScores = createFeatureSelector<GenomicScoreState[]>('genomicScores');

export const setGenomicScores = createAction(
  '[Genotype] Set genomic scores',
  props<{ genomicScores: GenomicScoreState[] }>()
);

export const setGenomicScoresContinuous = createAction(
  '[Genotype] Set score with continuous histogram data',
  props<{score: string, rangeStart: number, rangeEnd: number}>()
);

export const setGenomicScoresCategorical = createAction(
  '[Genotype] Set score with categorical histogram data',
  props<{score: string, values: string[], categoricalView: CategoricalHistogramView}>()
);

export const resetGenomicScores = createAction(
  '[Genotype] Reset genomic scores'
);

export const genomicScoresReducer = createReducer(
  initialState,
  on(setGenomicScores, (state, {genomicScores}) => cloneDeep(genomicScores)),
  on(setGenomicScoresContinuous, (state, { score, rangeStart, rangeEnd }) => {
    const newGenomicScore = {
      histogramType: 'continuous' as const,
      score: score,
      rangeStart: rangeStart,
      rangeEnd: rangeEnd,
      values: null,
      categoricalView: null,
    };
    const scores = [...state];
    const scoreIndex = scores.findIndex(s => s.score === score);
    if (!scores.length || scoreIndex === -1) {
      scores.push(newGenomicScore);
    } else {
      const scoreCopy = cloneDeep(scores.at(scoreIndex));
      scoreCopy.rangeStart = rangeStart;
      scoreCopy.rangeEnd = rangeEnd;
      scores[scoreIndex] = scoreCopy;
    }
    return scores;
  }),
  // on(setGenomicScoresCategorical, (state, { score, values, categoricalView }) => ({
  //   histogramType: 'categorical' as const,
  //   score: score,
  //   rangeStart: initialState.rangeStart,
  //   rangeEnd: initialState.rangeEnd,
  //   values: values,
  //   categoricalView: categoricalView,
  // })),
  on(reset, resetGenomicScores, state => cloneDeep(initialState)),
);
