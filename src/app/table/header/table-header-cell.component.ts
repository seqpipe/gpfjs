import { ContentChild, ViewChildren, ViewChild, HostListener, ChangeDetectorRef,
  Output, EventEmitter, Input, Directive, Component, OnInit, ContentChildren,
  QueryList, TemplateRef, ViewContainerRef, ComponentFactoryResolver,
  AfterViewInit, Query, ElementRef
} from '@angular/core';
import { GpfTableColumnComponent, GpfTableSubheaderComponent, SortInfo } from '../table.component'
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'gpf-table-header-cell',
  templateUrl: './table-header-cell.component.html',
  styleUrls: ['./table-header-cell.component.css']
})
export class GpfTableHeaderCellComponent {
  @Input() columnInfo: GpfTableColumnComponent;
  @Output() sortingInfoChange = new EventEmitter();
  @Input() sortingInfo: SortInfo;

  constructor(private viewContainer: ViewContainerRef) {
  }

  onSortClick(sortBySubcolumn: GpfTableSubheaderComponent) {
    let sortInfo: SortInfo;
    if (this.sortingInfo && this.sortingInfo.sortBySubcolumn === sortBySubcolumn) {
      sortInfo = new SortInfo(sortBySubcolumn, !this.sortingInfo.sortOrderAsc);
    } else {
      sortInfo = new SortInfo(sortBySubcolumn, true);
    }
    this.sortingInfoChange.emit(sortInfo);
    console.log("sort", sortInfo)
  }

  get imgPathPrefix() {
    return environment.imgPathPrefix;
  }
}
