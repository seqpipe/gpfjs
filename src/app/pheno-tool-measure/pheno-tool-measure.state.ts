import { createReducer, createAction, on, props, createFeatureSelector } from '@ngrx/store';
import { logout } from 'app/users/actions';
import { cloneDeep } from 'lodash';

export interface PhenoToolMeasureState {
  measureId: string;
  normalizeBy: object[];
}

export const initialState: PhenoToolMeasureState = {
  measureId: '',
  normalizeBy: []
};

export const selectPhenoToolMeasure = createFeatureSelector<PhenoToolMeasureState>('phenoToolMeasure');

export const setPhenoToolMeasure = createAction(
  '[Phenotype] Set phenoToolMeasure values',
  props<{ phenoToolMeasure: PhenoToolMeasureState }>()
);

export const resetPhenoToolMeasure = createAction(
  '[Phenotype] Reset phenoToolMeasure values'
);

export const phenoToolMeasureReducer = createReducer(
  initialState,
  on(setPhenoToolMeasure, (state, { phenoToolMeasure }) => cloneDeep(phenoToolMeasure)),
  on(logout, resetPhenoToolMeasure, state => cloneDeep(initialState)),
);
