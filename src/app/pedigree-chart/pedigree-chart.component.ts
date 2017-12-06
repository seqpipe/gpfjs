import { Input, Component, OnInit, SimpleChanges } from '@angular/core';
import { PedigreeData } from '../genotype-preview-model/genotype-preview';
import { Individual, MatingUnit } from './pedigree-data';

@Component({
  selector: 'gpf-pedigree-chart',
  templateUrl: './pedigree-chart.component.html'
})
export class PedigreeChartComponent {
  @Input() pedigreeData: PedigreeData[];
  levels: Array<Array <Individual> >;

  ngOnChanges(changes: SimpleChanges) {
    this.levels = new Array<Array <Individual> >();
    if ("pedigreeData" in changes) {
      this.parsePedigreeData();
    }
  }

  parsePedigreeData() {
    let idToNodeMap = new Map<string, Individual>();
    let idsToMatingUnit = new Map<string, MatingUnit>();

    let getOrCreateIndividual = (name) => {
      if (idToNodeMap.has(name)) {
        return idToNodeMap.get(name);
      }
      else{
        let individual = new Individual();
        idToNodeMap.set(name, individual);
        return individual;
      }
    };

    for (let elem of this.pedigreeData){
      if (!idsToMatingUnit.has(elem.mother + "," + elem.father)) {
        let mother = getOrCreateIndividual(elem.mother);
        let father = getOrCreateIndividual(elem.father);
        idsToMatingUnit.set(elem.mother + "," + elem.father, new MatingUnit(mother, father));
      }
      let parentNode = idsToMatingUnit.get(elem.mother + "," + elem.father);

      let node = getOrCreateIndividual(elem.id);
      node.pedigreeData = elem;
      parentNode.children.individuals.push(node);

    }

    this.traverseLevel(idsToMatingUnit.get(",").children.individuals, 0);
  }


  traverseLevel(levelIndividuals: Array<Individual>, level: number) {
    if (!this.levels[level]) {
      this.levels[level] = new Array<Individual>();
    }

    levelIndividuals.forEach((individual) =>
      this.levels[level].push(individual)
    );

    for (let individual of levelIndividuals) {
      if (individual.matingUnits.length > 0 && !individual.matingUnits[0].visited) {
        individual.matingUnits[0].visited = true;
        this.traverseLevel(individual.matingUnits[0].children.individuals, level + 1);
      }
    }
  }
}
