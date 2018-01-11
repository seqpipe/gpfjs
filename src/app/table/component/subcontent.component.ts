import { Input, Component, ContentChildren, QueryList, TemplateRef, ViewContainerRef } from '@angular/core';
import { GpfTableCellContentDirective } from './content.directive';

@Component({
  selector: 'gpf-table-subcontent',
  template: '',
})
export class GpfTableSubcontentComponent {
  @ContentChildren(GpfTableCellContentDirective) contentChildren: QueryList<GpfTableCellContentDirective>;
  @Input() field: string;
  contentTemplateRef: TemplateRef<any>;

  ngAfterContentInit() {
    if (this.contentChildren.first) {
      this.contentTemplateRef = this.contentChildren.first.templateRef;
    }
  }
}
