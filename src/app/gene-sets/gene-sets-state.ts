import { GeneSetsCollection, GeneSet } from './gene-sets';

export const GENE_SETS_COLLECTION_CHANGE = 'GENE_SETS_COLLECTION_CHANGE';
export const GENE_SET_CHANGE = 'GENE_SET_CHANGE';
export const GENE_SETS_TYPES_ADD = 'GENE_SETS_TYPES_ADD';
export const GENE_SETS_TYPES_REMOVE = 'GENE_SETS_TYPES_REMOVE';



export interface GeneSetsState {
  geneSetsCollection: GeneSetsCollection;
  geneSetsTypes: Set<any>,
  geneSet: GeneSet;
};

const initialState: GeneSetsState = {
  geneSetsCollection: null,
  geneSetsTypes: new Set<any>(),
  geneSet: null
};

export function geneSetsReducer(
  state: GeneSetsState = initialState,
  action): GeneSetsState {


  switch (action.type) {
    case GENE_SETS_COLLECTION_CHANGE:
      return Object.assign({}, state,
        { geneSetsCollection: action.payload, geneSet: null });
    case GENE_SET_CHANGE:
      return Object.assign({}, state,
        { geneSet: action.payload });
    case GENE_SETS_TYPES_ADD:
      var newSet = new Set<any>(state.geneSetsTypes);
      newSet.add(action.payload);
      return Object.assign({}, state,
        { geneSetsTypes: newSet });
    case GENE_SETS_TYPES_REMOVE:
      var newSet = new Set<any>(state.geneSetsTypes);
      newSet.delete(action.payload);
      return Object.assign({}, state,
        { geneSetsTypes: newSet });
    default:
      return state;
  }
};
