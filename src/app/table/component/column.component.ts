import { ContentChildren, ViewContainerRef, QueryList, ViewChildren, Component } from '@angular/core';

import { GpfTableContentHeaderComponent } from './header.component';
import { GpfTableContentComponent } from './content.component';

@Component({
  selector: 'gpf-table-column',
  template: '',
})
export class GpfTableColumnComponent {
  @ContentChildren(GpfTableContentHeaderComponent) headerChildren: QueryList<GpfTableContentHeaderComponent>;
  @ContentChildren(GpfTableContentComponent) contentChildren: QueryList<GpfTableContentComponent>;
  public width = 0;

  constructor(viewContainer: ViewContainerRef) {
  }
}
