import { Pipe, PipeTransform } from '@angular/core';
import { PValueIntensityPipe } from './p-value-intensity.pipe';

@Pipe({name: 'getBackgroundColor'})
export class BackgroundColorPipe implements PipeTransform {
  constructor(private pValueIntensityPipe: PValueIntensityPipe) {}
  public transform(pValue: string): string {
    const intensity = this.pValueIntensityPipe.transform(pValue) as number;
    return `rgba(255, ${intensity}, ${intensity}, 0.8)`;
  }
}
