import { NgModule } from '@angular/core';
import { CommonModule }        from '@angular/common';

import { PedigreeChartComponent} from './pedigree-chart.component';
import { PedigreeChartLevelComponent } from './pedigree-chart-level.component';
import { PedigreeChartMemberComponent } from './pedigree-chart-member.component';

@NgModule({
  declarations: [
    PedigreeChartComponent,
    PedigreeChartLevelComponent, 
    PedigreeChartMemberComponent
  ],
  exports: [
    PedigreeChartComponent,
  ],
  imports: [CommonModule]
})
export class PedigreeChartModule { }

