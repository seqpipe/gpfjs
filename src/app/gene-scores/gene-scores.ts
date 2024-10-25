import { IsNotEmpty, IsNumber, ValidateIf } from 'class-validator';
import { IsLessThanOrEqual } from '../utils/is-less-than-validator';
import { IsMoreThanOrEqual } from '../utils/is-more-than-validator';

export class GeneScores {
  public static fromJson(json: object): GeneScores {
    let histogram: NumberHistogram;
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    if (json['histogram']['config']['type'] as string === 'number') {
      histogram = new NumberHistogram(
        json['histogram']['bars'] as number[],
        json['histogram']['bins'] as number[],
        json['large_values_desc'] as string,
        json['small_values_desc'] as string,
        json['histogram']['config']['view_range']['min'] as number,
        json['histogram']['config']['view_range']['max'] as number,
        json['histogram']['config']['x_log_scale"'] as boolean,
        json['histogram']['config']['x_log_scale"'] as boolean,
      );
    }
    /* eslint-enable */

    return new GeneScores(
      json['desc'] as string,
      json['help'] as string,
      json['score'] as string,
      histogram,
    );
  }

  public static fromJsonArray(jsonArray: Array<object>): Array<GeneScores> {
    return jsonArray.map((json) => GeneScores.fromJson(json));
  }


  public constructor(
    public readonly desc: string,
    public readonly help: string,
    public readonly score: string,
    public readonly histogram: NumberHistogram,
  ) {

  }
}

export class NumberHistogram {
  public constructor(
    public readonly bars: number[],
    public readonly bins: number[],
    public readonly largeValuesDesc: string,
    public readonly smallValuesDesc: string,
    public readonly rangeMin: number,
    public readonly rangeMax: number,
    public readonly logScaleX: boolean,
    public readonly logScaleY: boolean,
  ) {
    if (bins.length === (bars.length + 1)) {
      bars.push(0);
    }
  }
}

export class GeneScoresLocalState {
  @IsNotEmpty()
  public score: GeneScores = null;

  @ValidateIf(o => o.rangeStart !== null)
  @IsNumber()
  @IsLessThanOrEqual('rangeEnd', {message: 'The range beginning must be lesser than the range end.'})
  @IsMoreThanOrEqual('domainMin', {message: 'The range beginning must be within the domain.'})
  @IsLessThanOrEqual('domainMax', {message: 'The range beginning must be within the domain.'})
  public rangeStart = 0;

  @ValidateIf(o => o.rangeEnd !== null)
  @IsNumber()
  @IsMoreThanOrEqual('rangeStart', {message: 'The range end must be greater than the range start.'})
  @IsMoreThanOrEqual('domainMin', {message: 'The range end must be within the domain.'})
  @IsLessThanOrEqual('domainMax', {message: 'The range end must be within the domain.'})
  public rangeEnd = 0;

  public domainMin = 0;
  public domainMax = 0;
}
