import { PedigreeData } from '../genotype-preview-table/genotype-preview';

export class Study {

  static fromJsonArray(json: any[]) {
    return new Study(json[0], json[1]);
  }

  constructor(
    readonly name: string,
    readonly description: string
  ) {}
}

export class Studies {

    static fromJson(json: any) {
      return new Studies(json['report_studies']
        .map(study => Study.fromJsonArray(study)));
    }

    constructor(
      readonly studies: Study[]
    ) {}

}

export class ChildrenCounter {

  static fromJson(json: any) {
    return new ChildrenCounter(
      json['phenotype'],
      json['children_male'],
      json['children_female'],
      json['children_total'],
    );
  }

  constructor(
    readonly phenotype: string,
    readonly childrenMale: number,
    readonly childrenFemale: number,
    readonly childrenTotal: number,
  ) {}
}

export class FamilyReport {

  static fromJson(json: any) {
    return new FamilyReport(
      json['phenotypes'],
      json['children_counters'].map(
        childCounter => ChildrenCounter.fromJson(childCounter)),
      json['families_counters'],
      json['families_total'],
    );
  }

  constructor(
    readonly phenotypes: string[],
    readonly childrenCounters: ChildrenCounter[],
    readonly familiesCounters: PedigreeData[],
    readonly familiesTotal: number,
  ) {}

}

export class DenovoReport {


  constructor (
    readonly phenotypes: string[],
    readonly effectGroups: string[],
    readonly effectTypes: string[],
  ) {}
}

export class VariantReport {

  static fromJson(json: any) {
    return new VariantReport(
      json['study_name'],
      json['study_description'],
      FamilyReport.fromJson(json['families_report']),
      json['denovo_report']
    );
  }

  constructor(
    readonly studyName: string,
    readonly studyDescription: string,
    readonly familyReport: FamilyReport,
    readonly denovoReport: DenovoReport


  ) {}

}
