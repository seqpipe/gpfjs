import { createReducer, createAction, on, props, createFeatureSelector } from '@ngrx/store';
import { logout } from 'app/users/actions';
import { cloneDeep } from 'lodash';

export const initialState: string[] = [];

export const selectPersonIds = createFeatureSelector<string[]>('personIds');

export const setPersonIds = createAction(
  '[Genotype] Set person ids',
  props<{ personIds: string[] }>()
);

export const resetPersonIds = createAction(
  '[Genotype] Reset person ids'
);

export const personIdsReducer = createReducer(
  initialState,
  on(setPersonIds, (state, {personIds}) => personIds),
  on(logout, resetPersonIds, state => cloneDeep(initialState)),
);
