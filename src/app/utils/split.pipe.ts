import { Pipe, PipeTransform } from '@angular/core';
/**
 * Simple string split pipe
 */
@Pipe({name: 'split'})
export class SplitPipe implements PipeTransform {
  public transform(text: string, separator: string): string[] {
    return text.split(separator);
  }
}
