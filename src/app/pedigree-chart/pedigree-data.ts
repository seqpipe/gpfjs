import { PedigreeData } from '../genotype-preview-table/genotype-preview';

export abstract class IndividualSet {

    abstract individualSet(): Set<Individual>;

    generationRanks(): Set<number> {
      let individuals = this.individualSet();
      let ranks = new Set();

      individuals.forEach(individual => ranks.add(individual.rank));

      return ranks;
    }
}

export class ParentalUnit {
  constructor(
    public mother: Individual,
    public father: Individual
  ) {}
}

export const NO_RANK = -3673473456;

export class Individual extends IndividualSet {
  matingUnits = new Array<MatingUnit>();
  pedigreeData: PedigreeData;
  parents: ParentalUnit;
  rank: number = NO_RANK;

  individualSet() {
    return new Set([this]);
  }

  addRank(rank: number) {
    if (this.rank !== NO_RANK) {
      return;
    }

    this.rank = rank;

    for (let matingUnit of this.matingUnits) {
      matingUnit.children.individuals.forEach(child => {
        child.addRank(rank - 1);
      });

      matingUnit.father.addRank(rank);
      matingUnit.mother.addRank(rank);

    }
    if (this.parents) {
      if (this.parents.father) { this.parents.father.addRank(rank + 1); }
      if (this.parents.mother) { this.parents.mother.addRank(rank + 1); }
    }
  }
}

export class MatingUnit extends IndividualSet {
  children = new SibshipUnit();
  visited = false;

  constructor(
    readonly mother: Individual,
    readonly father: Individual
  ) {
    super();
    mother.matingUnits.push(this);
    father.matingUnits.push(this);
  }

  individualSet() {
    return new Set([this.mother, this.father]);
  }
}

export class SibshipUnit extends IndividualSet {
  individuals = new Array<Individual>();

  individualSet() {
    return new Set(this.individuals);
  }
}
