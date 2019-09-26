import { IdName } from '../common/idname';
import { UserGroup } from '../users-groups/users-groups';
import * as _ from 'lodash';

export class SelectorValue extends IdName {
  static fromJson(json: any): SelectorValue {
    if (!json) {
      return undefined;
    }

    return new SelectorValue(
      json['id'],
      json['name'],
      json['color'],
    );
  }

  static fromJsonArray(jsonArray: Array<Object>): Array<SelectorValue> {
    if (!jsonArray) {
      return undefined;
    }
    return jsonArray.map((json) => SelectorValue.fromJson(json));
  }

  constructor(
    readonly id: string,
    readonly name: string,
    readonly color: string,
  ) {
    super(id, name);
  }
}

export class PedigreeSelector extends IdName {
  static fromJson(json: any): PedigreeSelector {
    if (!json) {
      return undefined;
    }

    return new PedigreeSelector(
      json['id'],
      json['name'],
      json['source'],
      SelectorValue.fromJson(json['defaultValue']),
      SelectorValue.fromJsonArray(json['domain']),
    );
  }
  static fromJsonArray(jsonArray: Array<Object>): Array<PedigreeSelector> {
    if (!jsonArray) {
      return undefined;
    }

    return jsonArray.map((json) => PedigreeSelector.fromJson(json));
  }

  constructor(
    readonly id: string,
    readonly name: string,
    readonly source: string,
    readonly defaultValue: SelectorValue,
    readonly domain: SelectorValue[]
  ) {
    super(id, name);
  }
}

export class PresentInRole {
  static fromJson(json: any): PresentInRole {
    if (!json) {
      return undefined;
    }

    return new PresentInRole(
      json['id'],
      json['name'],
      json['roles'],
    );
  }
  static fromJsonArray(jsonArray: Array<Object>): Array<PresentInRole> {
    if (!jsonArray) {
      return undefined;
    }

    return jsonArray.map((json) => PresentInRole.fromJson(json));
  }

  constructor(
    readonly id: string,
    readonly name: string,
    readonly roles: string[]
  ) {
  }
}

export class AdditionalColumnSlot {
  static fromJson(json: any): AdditionalColumnSlot {
    return new AdditionalColumnSlot(
      json['id'],
      json['name'],
      json['source'],
      json['format']
    );
  }

  static fromJsonArray(jsonArray: Array<Object>): Array<AdditionalColumnSlot> {
    if (!jsonArray) {
      return undefined;
    }
    return jsonArray.map((json) => AdditionalColumnSlot.fromJson(json));
  }

  constructor(
    readonly id: string,
    readonly name: string,
    readonly source: string,
    readonly format: string,
  ) {}
}

export class AdditionalColumn {
  static fromJson(json: any): AdditionalColumn {
    return new AdditionalColumn(
      json['id'],
      json['name'],
      json['source'],
      AdditionalColumnSlot.fromJsonArray(json['slots']),
    );
  }

  static fromJsonArray(jsonArray: Array<Object>): Array<AdditionalColumn> {
    if (!jsonArray) {
      return [];
    }
    return jsonArray.map((json) => AdditionalColumn.fromJson(json));
  }

  constructor(
    readonly id: string,
    readonly name: string,
    readonly source: string,
    readonly slots: Array<AdditionalColumnSlot>
  ) {}
}

export class MeasureFilter {
  static fromJson(json: any): MeasureFilter {
    return new MeasureFilter(
      json['role'],
      json['filterType'],
      json['measure'],
      json['domain']
    );
  }

  constructor(
    readonly role: string,
    readonly filterType: string,
    readonly measure: string,
    readonly domain: Array<string>
  ) {}
}

export class PhenoFilter {
  static fromJson(json: any): PhenoFilter {
    return new PhenoFilter(
      json['name'],
      json['measureType'],
      MeasureFilter.fromJson(json['measureFilter']),
    );
  }

  static fromJsonArray(jsonArray: Array<Object>): Array<PhenoFilter> {
    if (!jsonArray) {
      return undefined;
    }
    return jsonArray.map((json) => PhenoFilter.fromJson(json));
  }

  constructor(
    readonly name: string,
    readonly measureType: string,
    readonly measureFilter: MeasureFilter
  ) {}
}

export class GenotypeBrowser {

  readonly columns: Array<AdditionalColumn>;

  static fromJson(json: any): GenotypeBrowser {
    return new GenotypeBrowser(
      json['hasPedigreeSelector'],
      json['hasPresentInChild'],
      json['hasPresentInParent'],
      json['hasPresentInRole'],
      json['hasCNV'],
      json['hasComplex'],
      json['hasFamilyFilters'],
      json['hasStudyFilters'],
      json['hasStudyTypes'],
      json['hasGraphicalPreview'],
      json['previewColumns'],
      json['rolesFilterOptions'],
      [...AdditionalColumn.fromJsonArray(json['genotypeColumns'])],
      PhenoFilter.fromJsonArray(json['phenoFilters']),
      PhenoFilter.fromJsonArray(json['familyFilters']),
      PresentInRole.fromJsonArray(json['presentInRole']),
      json['inheritanceTypeFilter'],
      json['selectedInheritanceTypeFilterValues'],
    );
  }

  constructor(
    readonly hasPedigreeSelector: boolean,
    readonly hasPresentInChild: boolean,
    readonly hasPresentInParent: boolean,
    readonly hasPresentInRole: boolean,
    readonly hasCNV: boolean,
    readonly hasComplex: boolean,
    readonly hasFamilyFilters: boolean,
    readonly hasStudyFilters: boolean,
    readonly hasStudyTypes: boolean,
    readonly hasGraphicalPreview: boolean,
    readonly previewColumnsIds: string[],
    readonly rolesFilterOptions: string[],
    readonly allColumns: Array<AdditionalColumn>,
    readonly phenoFilters: Array<PhenoFilter>,
    readonly familyFilters: Array<PhenoFilter>,
    readonly presentInRole: PresentInRole[],
    readonly inheritanceTypeFilter: string[],
    readonly selectedInheritanceTypeFilterValues: string[],
  ) {
    this.columns = _.filter(this.allColumns,
      (column: AdditionalColumn) => this.previewColumnsIds.indexOf(column.id) > -1);
  }
}

export class PeopleGroup {

  static fromJson(json: any): PeopleGroup {
    return new PeopleGroup(
      PedigreeSelector.fromJsonArray(json['peopleGroup'])
    );
  }

  constructor(
    readonly pedigreeSelectors: PedigreeSelector[],
  ) { }
}

export class Dataset extends IdName {
  static fromJson(json: any): Dataset {
    if (!json) {
      return undefined;
    }
    return new Dataset(
      json['id'],
      json['description'],
      json['name'],
      json['accessRights'],
      json['studies'],
      json['studyTypes'],
      json['phenoDB'],
      json['genotypeBrowser'],
      json['phenotypeTool'],
      json['enrichmentTool'],
      json['phenotypeBrowser'],
      json['commonReport'],
      json['genotypeBrowserConfig'] ? GenotypeBrowser.fromJson(json['genotypeBrowserConfig']) : null,
      json['peopleGroupConfig'] ? PeopleGroup.fromJson(json['peopleGroupConfig']) : null,
      UserGroup.fromJsonArray(json['groups']),
    );
  }

  static fromJsonArray(jsonArray: Array<Object>): Array<Dataset> {
    if (!jsonArray) {
      return undefined;
    }
    return jsonArray.map((json) => Dataset.fromJson(json));
  }

  getDefaultGroups() {
    return ['any_dataset', this.id];
  }

  constructor(
    readonly id: string,
    readonly description: string,
    readonly name: string,
    readonly accessRights: boolean,
    readonly studies: string[],
    readonly studyTypes: string[],
    readonly phenoDB: string,
    readonly genotypeBrowser: boolean,
    readonly phenotypeTool: boolean,
    readonly enrichmentTool: boolean,
    readonly phenotypeBrowser: boolean,
    readonly commonReport: boolean,
    readonly genotypeBrowserConfig: GenotypeBrowser,
    readonly peopleGroupConfig: PeopleGroup,
    readonly groups: UserGroup[]
  ) {
    super(id, name);
  }
}

