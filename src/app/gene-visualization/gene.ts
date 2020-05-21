export class Exon {
  constructor(
    private start: number,
    private stop: number
  ) {}

  static fromJson(json: any): Exon {
    return new Exon(json['start'], json['stop']);
  }

  static fromJsonArray(jsonArray: Array<Object>): Array<Exon> {
    return jsonArray.map(json => Exon.fromJson(json));
  }
}

export class Transcript {
  constructor(
    private transcript_id: string,
    private strand: string,
    private chrom: string,
    private utr3: Exon,
    private utr5: Exon,
    private _exons: Exon[]
  ) {}

  static fromJson(json: any): Transcript {
    return new Transcript(
      json['transcript_id'], json['strand'], json['chrom'],
      Exon.fromJson(json['utr3']), Exon.fromJson(json['utr5']),
      Exon.fromJsonArray(json['exons']));
  }

  static fromJsonArray(jsonArray: Array<Object>): Array<Transcript> {
    return jsonArray.map(json => Transcript.fromJson(json));
  }

  get exons() {
    return this._exons;
  }
}

export class Gene {
  constructor(
    private _gene: string,
    private _transcripts: Transcript[]
  ) {}

  static fromJson(json: any): Gene {
    return new Gene(json['gene'], Transcript.fromJsonArray(json['transcripts']));
  }

  static fromJsonArray(jsonArray: Array<Object>): Array<Gene> {
    return jsonArray.map(json => Gene.fromJson(json));
  }

  get transcripts() {
    return this._transcripts;
  }

  get gene() {
    return this._gene;
  }
}
