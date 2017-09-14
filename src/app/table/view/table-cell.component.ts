import { Input, Component, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { GpfTableColumnComponent } from '../component/column.component'

@Component({
  selector: 'gpf-table-cell',
  templateUrl: './table-cell.component.html'
})
export class GpfTableCellComponent {
  @Input() columnInfo: GpfTableColumnComponent;
  @Input() data: any;
  private nativeElement: any;

  constructor(private viewContainer: ViewContainerRef) {
    this.nativeElement = viewContainer.element.nativeElement
  }

  ngAfterViewInit() {
    this.columnInfo.width = this.nativeElement.getBoundingClientRect().width
  }
}
