import { Injectable } from '@angular/core';
import { PedigreeData } from '../genotype-preview-model/genotype-preview';
import { Individual, MatingUnit, IndividualSet, ParentalUnit } from '../pedigree-chart/pedigree-data';
import { Edge as GraphEdge, Vertex as GraphVertex } from '../utils/undirected-graph';
import {
  hasIntersection, intersection, equal, isSubset, difference
} from '../utils/sets-helper';
import { SandwichInstance, solveSandwich, IntervalForVertex } from '../utils/interval-sandwich';


type Vertex = GraphVertex<IndividualSet>;
type Edge = GraphEdge<Vertex>;

@Injectable()
export class PerfectlyDrawablePedigreeService {

  createSandwichInstance(family: PedigreeData[]) {
    let [idsToIndividualUnit, idsToMatingUnit] = this.getIndividualsAndMatingUnitMaps(family);

    let individualVertices = this.getIndividualsFromMap(idsToIndividualUnit) as IndividualSet[];

    let matingVertices: Vertex[] = [];
    let sibshipVertices: Vertex[] = [];

    idsToMatingUnit.forEach(matingUnit => {
      matingVertices.push(matingUnit);
      if (matingUnit.children.individuals.length > 0) {
        sibshipVertices.push(matingUnit.children);
      }
    });

    let allVertices: Vertex[] = individualVertices.concat(matingVertices).concat(sibshipVertices);

    if (individualVertices.length) {
      (individualVertices[0] as Individual).addRank(0);
      this.fixRank(individualVertices as Individual[]);
    }


    // Ea-
    let sameRankEdges: Edge[] = [];
    for (let i = 0; i < individualVertices.length - 1; i++) {
      for (let j = i + 1; j < individualVertices.length; j++) {
        if (equal(individualVertices[i].generationRanks(), individualVertices[j].generationRanks())) {
          sameRankEdges.push([individualVertices[i], individualVertices[j]]);
        }
      }
    }


    // Eb+ and Eb-
    let matingEdges: Edge[] = [];
    let sameGenerationNotMateEdges: Edge[] = [];
    for (let individual of individualVertices) {
      for (let matingUnit of matingVertices) {
        if (isSubset(individual.individualSet(), matingUnit.individualSet())) {
          matingEdges.push([individual, matingUnit]);
        } else if (equal(individual.generationRanks(), matingUnit.generationRanks())) {
          sameGenerationNotMateEdges.push([individual, matingUnit]);
        }
      }
    }

    // Ec+ and Ec-
    let sibshipEdges: Edge[] = [];
    let sameGenerationNotSiblingEdges: Edge[] = [];
    for (let individual of individualVertices as Individual[]) {
      for (let sibshipUnit of sibshipVertices) {
        if (isSubset(individual.individualSet(), sibshipUnit.individualSet())) {
          sibshipEdges.push([individual, sibshipUnit]);
        } else if (equal(individual.generationRanks(), sibshipUnit.generationRanks())) {
          if (individual.parents) {
              sameGenerationNotSiblingEdges.push([individual, sibshipUnit]);
          }
        }
      }
    }



    // Ed+
    let matingUnitSibshipUnitEdges: Edge[] = [];
    for (let sibshipUnit of sibshipVertices) {
      for (let matingUnit of matingVertices) {
        if (equal(matingUnit.childrenSet(), sibshipUnit.individualSet())) {
          matingUnitSibshipUnitEdges.push([matingUnit, sibshipUnit]);
        }
      }
    }
    // console.log("matingUnitSibshipUnitEdges", matingUnitSibshipUnitEdges);

    // Ee-
    let intergenerationalEdges: Edge[] = [];
    for (let sibshipUnit of sibshipVertices.concat(matingVertices)) {
      for (let matingUnit of matingVertices) {
        if (!hasIntersection(matingUnit.generationRanks(), sibshipUnit.generationRanks())) {
          if (!hasIntersection(matingUnit.individualSet(), sibshipUnit.individualSet())) {
            if (!matingUnitSibshipUnitEdges.find(
              ([mu, sibship]) => mu === matingUnit &&
                                 sibship === sibshipUnit)) {
              intergenerationalEdges.push([matingUnit, sibshipUnit]);
            }
          }
        }
      }
    }

    let requiredEdges = new Set(
      matingEdges.concat(sibshipEdges).concat(matingUnitSibshipUnitEdges));
    let forbiddenEdges = new Set(
      sameRankEdges
        .concat(sameGenerationNotMateEdges)
        .concat(sameGenerationNotSiblingEdges)
        .concat(intergenerationalEdges)
    );

    return new SandwichInstance(allVertices, requiredEdges, forbiddenEdges);
  }

  private getIndividualsAndMatingUnitMaps(family: PedigreeData[]):
      [Map<string, Individual>, Map<string, MatingUnit>] {
    let idToNodeMap = new Map<string, Individual>();
    let idsToMatingUnit = new Map<string, MatingUnit>();

    let getOrCreateIndividual = (name) => {
      if (idToNodeMap.has(name)) {
        return idToNodeMap.get(name);
      } else {
        let individual = new Individual();
        idToNodeMap.set(name, individual);
        return individual;
      }
    };

    for (let individual of family) {
      let mother = getOrCreateIndividual(individual.mother);
      let father = getOrCreateIndividual(individual.father);
      if (mother !== father && !idsToMatingUnit.has(individual.mother + ',' + individual.father)) {
        idsToMatingUnit.set(individual.mother + ',' + individual.father, new MatingUnit(mother, father));
      }
      let parentNode = idsToMatingUnit.get(individual.mother + ',' + individual.father);

      let node = getOrCreateIndividual(individual.id);

      node.pedigreeData = individual;
      if (mother !== father) {
        node.parents = new ParentalUnit(mother, father);
      }

      if (parentNode) {
        parentNode.children.individuals.push(node);
      }
    }

    idToNodeMap.delete('0');
    idToNodeMap.delete('');

    return [idToNodeMap, idsToMatingUnit]
  }

  private getIndividualsFromMap(idToNodeMap: Map<string, Individual>) {
    let individualVertices: Individual[] = [];
    idToNodeMap.forEach(individual => {
      individualVertices.push(individual);
    });

    return individualVertices;
  }

  getIndividuals(family: PedigreeData[]) {
    let idToNodeMap = this.getIndividualsAndMatingUnitMaps(family)[0];

    return this.getIndividualsFromMap(idToNodeMap);
  }

  isPDP(family: PedigreeData[]) {
    let start = Date.now();
    let sandwichInstance = this.createSandwichInstance(family);
    let result: [SandwichInstance<Vertex>, IntervalForVertex<Vertex>[]] =
      [sandwichInstance, solveSandwich(sandwichInstance)] ;

    console.warn('isPDP took', Date.now() - start, 'ms');

    return result;

  }

  fixRank(intervals: Array<Individual>) {
    if (!intervals) {
      return intervals;
    }

    let maxRank = intervals.map(interval => interval.rank)
      .reduce((acc, current) => Math.max(acc, current), 0);

    return intervals.map(interval => {
      interval.rank -= maxRank;
      interval.rank = -interval.rank;
      return interval;
    });
  }

}
