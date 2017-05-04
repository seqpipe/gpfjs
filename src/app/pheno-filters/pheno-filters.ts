export const PHENO_FILTERS_INIT = 'PHENO_FILTERS_INIT';
export const PHENO_FILTERS_ADD_CONTINUOUS = 'PHENO_FILTERS_ADD_CONTINUOUS';
export const PHENO_FILTERS_ADD_CATEGORICAL = 'PHENO_FILTERS_ADD_CATEGORICAL';
export const PHENO_FILTERS_CHANGE_MEASURE = 'PHENO_FILTERS_CHANGE_MEASURE';
export const PHENO_FILTERS_CHANGE_CONTINUOUS_MEASURE = 'PHENO_FILTERS_CHANGE_CONTINUOUS_MEASURE';
export const PHENO_FILTERS_CONTINUOUS_SET_MIN = 'PHENO_FILTERS_CONTINUOUS_SET_MIN';
export const PHENO_FILTERS_CONTINUOUS_SET_MAX = 'PHENO_FILTERS_CONTINUOUS_SET_MAX';
export const PHENO_FILTERS_CATEGORICAL_SET_SELECTION = 'PHENO_FILTERS_CATEGORICAL_SET_SELECTION';
import { Validate } from "class-validator";
import { IsNumber, Min, Max } from "class-validator";
import { IsLessThanOrEqual } from "../utils/is-less-than-validator"
import { IsMoreThanOrEqual } from "../utils/is-more-than-validator"

export class PhenoFilterState {
  constructor(
    readonly id: string,
    readonly measureType: string,
    readonly role: string,
    public measure: string,
  ) {}

  isEmpty() {
    return this.measure == null
        || this.measure.length == 0;
  }
}

export class CategoricalFilterState extends PhenoFilterState {
  selection = [];

  constructor(
    id: string,
    type: string,
    role: string,
    measure: string
  ) {
    super(id, type, role, measure);
  }

  isEmpty() {
    return this.selection.length == 0
        || super.isEmpty();
  }
};

export class ContinuousFilterState extends PhenoFilterState {
  @IsNumber()
  @Min(0)
  @IsLessThanOrEqual("mmax")
  @IsMoreThanOrEqual("domainMin")
  mmin: number;

  @IsNumber()
  @Min(0)
  @IsMoreThanOrEqual("mmin")
  @IsLessThanOrEqual("domainMax")
  mmax: number;

  domainMin: number;
  domainMax: number;

  constructor(
    id: string,
    role: string,
    measure: string
  ) {
    super(id, 'continuous', role, measure);
  }
};

export class PhenoFiltersState {
  phenoFilters: Array<PhenoFilterState>;
};

const initialState: PhenoFiltersState = {
  phenoFilters: new Array<PhenoFilterState>()
};

export function phenoFiltersReducer(
  state: PhenoFiltersState = null,
  action): PhenoFiltersState {


  switch (action.type) {
    case PHENO_FILTERS_CATEGORICAL_SET_SELECTION:
      var newPhenoFilters = state.phenoFilters.map(
        (currentElement) => {
          if (currentElement.id == action.payload.id) {
            return Object.assign({}, currentElement,
              { selection: action.payload.selection });
          }
          return currentElement;
      });
      return Object.assign({}, state,
        { phenoFilters: newPhenoFilters });
    case PHENO_FILTERS_CHANGE_MEASURE:
      var newPhenoFilters = state.phenoFilters.map(
        (currentElement) => {
          if (currentElement.id == action.payload.id) {
            return Object.assign({}, currentElement,
              { measure: action.payload.measure });
          }
          return currentElement;
      });
      return Object.assign({}, state,
        { phenoFilters: newPhenoFilters });
    case PHENO_FILTERS_CHANGE_CONTINUOUS_MEASURE:
      var newPhenoFilters = state.phenoFilters.map(
        (currentElement) => {
          if (currentElement.id == action.payload.id) {
            return Object.assign({}, currentElement,
              {
                measure: action.payload.measure,
                domainMin: action.payload.domainMin,
                domainMax: action.payload.domainMax,
                mmin: action.payload.domainMin,
                mmax: action.payload.domainMax
              });
          }
          return currentElement;
      });
      return Object.assign({}, state,
        { phenoFilters: newPhenoFilters });
    case PHENO_FILTERS_CONTINUOUS_SET_MIN:
      var newPhenoFilters = state.phenoFilters.map(
        (currentElement) => {
          if (currentElement.id == action.payload.id) {
            return Object.assign({}, currentElement,
              { mmin: action.payload.value });
          }
          return currentElement;
      });
      return Object.assign({}, state,
        { phenoFilters: newPhenoFilters });
    case PHENO_FILTERS_CONTINUOUS_SET_MAX:
      var newPhenoFilters = state.phenoFilters.map(
        (currentElement) => {
          if (currentElement.id == action.payload.id) {
            return Object.assign({}, currentElement,
              { mmax: action.payload.value });
          }
          return currentElement;
      });
      return Object.assign({}, state,
        { phenoFilters: newPhenoFilters });
    case PHENO_FILTERS_ADD_CONTINUOUS:
      var newPhenoFilters = [...state.phenoFilters,
        new ContinuousFilterState(
          action.payload.name,
          action.payload.role,
          action.payload.measure
        )]
      return Object.assign({}, state,
        { phenoFilters: newPhenoFilters });
    case PHENO_FILTERS_ADD_CATEGORICAL:
      var newPhenoFilters = [...state.phenoFilters,
        new CategoricalFilterState(
          action.payload.name,
          action.payload.type,
          action.payload.role,
          action.payload.measure
        )]
      return Object.assign({}, state,
        { phenoFilters: newPhenoFilters });
    case PHENO_FILTERS_INIT:
      return initialState;
    default:
      return state;
  }
};
