import { GeneSetsState } from '../gene-sets/gene-sets-state';
import { GeneSymbols } from '../gene-symbols/gene-symbols';
import { GeneWeightsState } from '../gene-weights/gene-weights-store';

export interface GeneSetState {
  geneSetsCollection: string;
  geneSet: string;
  geneSetsTypes?: Object;
}


export class CommonQueryData {
  geneSymbols: string[];
  geneWeights: GeneWeightsState;
  geneSet: GeneSetState;
  datasetId: string;

  protected static prepareDatasetId(state: any): string {
    return state.datasets.selectedDataset.id;
  }

  protected static prepareGeneSymbols(state: any): string[] {
    let geneSymbols: GeneSymbols = state.geneSymbols;

    if (geneSymbols === null) {
      return null;
    }

    let result = geneSymbols.geneSymbols
      .split(/[,\s]/)
      .filter(s => s !== '')
      .map(s => s.toUpperCase());
    if (result.length === 0) {
      return null;
    }
    return result;
  }

  protected static prepareGeneSet(state: any): GeneSetState {
    let geneSetsState: GeneSetsState = state.geneSets;

    if (geneSetsState === null) {
      return null;
    }

    if (!geneSetsState.geneSetsCollection ||
      !geneSetsState.geneSet) {
      return null;
    }
    return {
      geneSetsCollection: geneSetsState.geneSetsCollection.name,
      geneSet: geneSetsState.geneSet.name,
      geneSetsTypes: geneSetsState.geneSetsTypes
    };
  }

  protected static prepareGeneWeights(state: any): GeneWeightsState {
    let weightsState: GeneWeightsState = state.geneWeights;

    if (weightsState === null) {
      return null;
    }

    if (weightsState.weight === null || weightsState.weight === undefined) {
      return null;
    }
    return weightsState;
  }


}
