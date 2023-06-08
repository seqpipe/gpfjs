import { DatasetsService } from 'app/datasets/datasets.service';
import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'customText', async: false })
export class RegionsFilterValidator implements ValidatorConstraintInterface {
  public validate(text: string): boolean {
    if (!text) {
      return null;
    }

    let valid = true;
    const lines = text.split(/[\n,]/)
      .map(t => t.trim())
      .filter(t => Boolean(t));

    if (lines.length === 0) {
      valid = false;
    }

    for (const line of lines) {
      valid = valid && this.isValid(line);
    }

    return valid;
  }

  private isValid(line: string): boolean {
    let lineRegex = '(2[0-2]|1[0-9]|[0-9]|X|Y):([0-9]+)(?:-([0-9]+))?|(2[0-2]|1[0-9]|[0-9]|X|Y)';
    if (DatasetsService.currentGenome === 'hg38') {
      lineRegex = 'chr(2[0-2]|1[0-9]|[0-9]|X|Y):([0-9]+)(?:-([0-9]+))?|chr(2[0-2]|1[0-9]|[0-9]|X|Y)';
    }

    const match = line.match(new RegExp(lineRegex, 'i'));
    if (match === null) {
      return false;
    }

    if (match[0] !== line) {
      return false;
    }

    if (
      match.length >= 3
      && match[2]
      && match[3]
      && Number(match[2].replace(',', '')) > Number(match[3].replace(',', ''))
    ) {
      return false;
    }

    return true;
  }

  public defaultMessage(): string {
    return 'Invalid region!';
  }
}
