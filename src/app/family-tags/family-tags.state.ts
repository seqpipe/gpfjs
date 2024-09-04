import { createReducer, createAction, on, props, createFeatureSelector } from '@ngrx/store';
import { FamilyTags } from './family-tags';
import { cloneDeep } from 'lodash';
import { logout } from 'app/users/actions';

export const initialState: FamilyTags = {
  selectedFamilyTags: [],
  deselectedFamilyTags: [],
  tagIntersection: true,
};

export const selectFamilyTags = createFeatureSelector<FamilyTags>('familyTags');

export const setFamilyTags = createAction(
  '[Genotype] Set family tags',
  props<FamilyTags>()
);

export const resetFamilyTags = createAction(
  '[Genotype] Reset family tags'
);

export const familyTagsReducer = createReducer(
  initialState,
  on(
    setFamilyTags,
    (state, { selectedFamilyTags, deselectedFamilyTags, tagIntersection }) => cloneDeep({
      selectedFamilyTags: selectedFamilyTags,
      deselectedFamilyTags: deselectedFamilyTags,
      tagIntersection: tagIntersection,
    })
  ),
  on(logout, resetFamilyTags, state => cloneDeep(initialState)),
);
