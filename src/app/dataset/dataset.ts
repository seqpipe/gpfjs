import { IdDescription } from '../common/iddescription';


export class Dataset extends IdDescription {
  constructor(
    readonly id: string,
    readonly description: string,
    readonly hasDenovo: boolean,
    readonly hasTransmitted: boolean,
    readonly hasCnv: boolean
  ) {
    super(id, description);
  }


}
