import { createReducer, createAction, on, props, createFeatureSelector } from '@ngrx/store';
export const initialState = [];

export const selectFamilyIds = createFeatureSelector<object>('familyIds');

export const setFamilyIds = createAction(
  '[Genotype] Set family ids',
  props<{ familyIds: string[] }>()
);

export const resetFamilyIds = createAction(
  '[Genotype] Reset family ids'
);

export const familyIdsReducer = createReducer(
  initialState,
  on(setFamilyIds, (state, {familyIds}) => familyIds),
  on(resetFamilyIds, state => []),
);
