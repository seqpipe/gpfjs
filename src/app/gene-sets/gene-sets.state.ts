import { createReducer, createAction, on, props, createFeatureSelector } from '@ngrx/store';
import { cloneDeep } from 'lodash';
import { GeneSet, GeneSetsCollection, GeneSetType } from './gene-sets';

export interface GeneSetsState {
  geneSetsTypes: GeneSetType[];
  geneSetsCollection: GeneSetsCollection;
  geneSet: GeneSet;
}

export const initialState: GeneSetsState = {
  geneSet: null,
  geneSetsCollection: null,
  geneSetsTypes: null,
};

export const selectGeneSets =
  createFeatureSelector<GeneSetsState>('geneSets');

export const setGeneSetsValues = createAction(
  '[Genotype] Set geneSets values',
  props<GeneSetsState>()
);

export const getGeneSetsValues = createAction(
  '[Genotype] Set geneSets values');

export const resetGeneSetsValues = createAction(
  '[Genotype] Reset geneSets values'
);

export const geneSetsReducer = createReducer(
  initialState,
  on(setGeneSetsValues, (state, { geneSetsTypes, geneSetsCollection, geneSet }) => ({
    geneSetsTypes: cloneDeep(geneSetsTypes),
    geneSetsCollection: cloneDeep(geneSetsCollection),
    geneSet: cloneDeep(geneSet)
  })),
  on(getGeneSetsValues, (state) => cloneDeep(state)),
  on(resetGeneSetsValues, state => cloneDeep(initialState)),
);
