export class BrowserQueryFilter {
  constructor(
    private datasetId: string,
    private geneSymbols: string[],
    private effectTypes: string[],
    private gender: string[],
    private personSetCollection: PersonSetCollection,
    private studyTypes: string[],
    private variantTypes: string[],
    private genomicScores: GenomicScore[],
    private presentInParent: PresentInParent,
    private presentInChild: string[],
  ) { }

  public static fromJson(json: any): BrowserQueryFilter {
    return new BrowserQueryFilter(
      json['datasetId'],
      json['geneSymbols'],
      json['effectTypes'],
      json['gender'],
      PersonSetCollection.fromJson(json['personSetCollection']),
      json['studyTypes'],
      json['variantTypes'],
      GenomicScore.fromJsonArray(json['genomicScores']),
      PresentInParent.fromJson(json['presentInParent']),
      json['presentInChild']
    );
  }
}

export class PersonSetCollection {
  constructor(
    private id: string,
    private checkedValues: string[],
  ) { }

  public static fromJson(json: any): PersonSetCollection {
    return new PersonSetCollection(
      json['id'],
      json['checkedValues']
    );
  }
}

export class GenomicScore {
  constructor(
    private metric: string,
    private rangeStart: number,
    private rangeEnd: number,
  ) {}

  public static fromJson(json: any): GenomicScore {
    return new GenomicScore(
      json['metric'],
      json['rangeStart'],
      json['rangeEnd'],
    );
  }

  public static fromJsonArray(json: object): Array<GenomicScore> {
    if (!json) {
      return [];
    }

    return Object.values(json).map(arr => GenomicScore.fromJson(arr));
  }
}
export class PresentInParent {
  constructor(
    private presentInParent: string[],
    private rarity: PresentInParentRarity,
  ) { }

  public static fromJson(json: any): PresentInParent {
    return new PresentInParent(
      json['presentInParent'],
      PresentInParentRarity .fromJson(json['rarity'])
    );
  }
}

export class PresentInParentRarity {
  constructor(
    private minFreq: number,
    private maxFreq: number,
    private ultraRare: boolean,
  ) { }

  public static fromJson(json: any): PresentInParentRarity {
    return new PresentInParentRarity(
      json['minFreq'],
      json['maxFreq'],
      json['ultraRare']
    );
  }
}
