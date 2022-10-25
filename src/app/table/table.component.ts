import {
  ContentChild, ViewChildren, ViewChild, HostListener, Input, Component, ContentChildren, QueryList, OnChanges, AfterViewChecked, ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { GpfTableColumnComponent } from './component/column.component';
import { GpfTableSubheaderComponent } from './component/subheader.component';
import { GpfTableLegendDirective } from './component/legend.directive';

export class SortInfo {
  public constructor(
    public sortBySubcolumn: GpfTableSubheaderComponent,
    public sortOrderAsc: boolean
  ) { }
}

@Component({
  selector: 'gpf-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GpfTableComponent implements OnChanges, AfterViewChecked {
  @ViewChild('table') public tableViewChild: any;
  @ViewChildren('rows') public rowViewChildren: QueryList<any>;

  @ContentChildren(GpfTableColumnComponent) public columnsChildren: QueryList<GpfTableColumnComponent>;
  @ContentChild(GpfTableLegendDirective) public legend: GpfTableLegendDirective;
  @Input() public dataSource: Array<any>;
  @Input() public noScrollOptimization = false;

  private previousSortingInfo: SortInfo;
  private lastRowHeight = 80;
  private drawOutsideVisibleCount = 5;
  private tableTopPosition = 0;

  public noResultsWidth: string;
  public tableData: Array<any> = [];

  public showFloatingHeader: boolean;
  public showLegend: boolean;

  constructor(private cdr: ChangeDetectorRef) {
  }

  public ngOnChanges() {
    this.tableData = this.getVisibleData();
  }

  public ngAfterViewChecked(): void {
    if (this.tableData.length === 0) {
      this.tableData = this.getVisibleData();
      this.cdr.detectChanges();
    }
  }

  @HostListener('window:scroll', ['$event'])
  public onWindowScroll(): void {
    this.tableTopPosition = this.tableViewChild.nativeElement.getBoundingClientRect().top;

    if (this.rowViewChildren && this.rowViewChildren.first) {
      this.showLegend = this.rowViewChildren.first.nativeElement.getBoundingClientRect().bottom < window.innerHeight;
    }

    if (
      this.rowViewChildren
      && this.rowViewChildren.last
      && this.rowViewChildren.last.nativeElement.getBoundingClientRect().height > 0
    ) {
      this.lastRowHeight = this.rowViewChildren.last.nativeElement.getBoundingClientRect().height;
    }

    this.showFloatingHeader = this.tableTop();
    this.tableData = this.getVisibleData();
  }

  public set sortingInfo(sortingInfo: SortInfo) {
    this.previousSortingInfo = sortingInfo;
    sortingInfo.sortBySubcolumn.sort(this.dataSource, sortingInfo.sortOrderAsc);
    this.tableData = this.getVisibleData();
  }

  public get sortingInfo(): SortInfo {
    return this.previousSortingInfo;
  }

  public tableTop(): boolean {
    return this.tableViewChild.nativeElement.getBoundingClientRect().top < 0;
  }

  public getScrollIndices(): Array<number> {
    if (!this.dataSource) {
      return [0, 0];
    }
    const visibleRowCount = Math.ceil(window.innerHeight / this.lastRowHeight);
    const maxRowCountToDraw = this.drawOutsideVisibleCount * 2 + visibleRowCount;

    let startIndex = Math.ceil(-this.tableTopPosition / this.lastRowHeight) - this.drawOutsideVisibleCount;

    // We should display at least maxRowCountToDraw rows, even at the bottom of the page
    const maxStartIndex = this.dataSource.length - maxRowCountToDraw;
    startIndex = Math.min(startIndex, maxStartIndex);

    // Make sure we always start from index 0 or above
    startIndex = Math.max(0, startIndex);

    const endIndex = startIndex + maxRowCountToDraw;
    return [startIndex, endIndex];
  }

  public get beforeDataCellHeight(): number {
    if (this.noScrollOptimization) {
      return 0;
    }
    return this.getScrollIndices()[0] * this.lastRowHeight;
  }

  public get afterDataCellHeight(): number {
    if (this.noScrollOptimization || !this.dataSource) {
      return 0;
    }

    const result = (this.dataSource.length - this.getScrollIndices()[1]) * this.lastRowHeight;
    return result > 0 ? result : 0;
  }

  public getVisibleData(): Array<any> {
    if (this.dataSource === undefined || this.dataSource === null || this.dataSource.length === 0) {
      if (this.columnsChildren !== undefined && this.columnsChildren !== null) {
        let width = 0;
        this.columnsChildren.forEach(column => {
          width += Number(column.columnWidth.split('px')[0]);
        });
        this.noResultsWidth = String(width) + 'px';
      }
    }
    if (!this.dataSource) {
      return [];
    }
    if (this.noScrollOptimization) {
      return this.dataSource;
    }
    const scrollIndices = this.getScrollIndices();
    return this.dataSource.slice(scrollIndices[0], scrollIndices[1]);
  }
}
