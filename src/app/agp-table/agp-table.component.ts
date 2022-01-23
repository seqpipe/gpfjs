import { Component, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { NgbDropdownMenu } from '@ng-bootstrap/ng-bootstrap';
import { ItemApplyEvent } from 'app/multiple-select-menu/multiple-select-menu';
import { MultipleSelectMenuComponent } from 'app/multiple-select-menu/multiple-select-menu.component';
import { SortingButtonsComponent } from 'app/sorting-buttons/sorting-buttons.component';
import { AgpConfig, Column } from './agp-table';
import { AutismGeneProfilesService } from 'app/agp-table/agp-table.service';
import { debounceTime, distinctUntilChanged, take } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'gpf-agp-table',
  templateUrl: './agp-table.component.html',
  styleUrls: ['./agp-table.component.css']
})
export class AgpTableComponent implements OnInit {
  @ViewChild(NgbDropdownMenu) public ngbDropdownMenu: NgbDropdownMenu;
  @ViewChild(MultipleSelectMenuComponent) public multipleSelectMenuComponent: MultipleSelectMenuComponent;
  @ViewChildren(SortingButtonsComponent) public sortingButtonsComponents: SortingButtonsComponent[];

  public config: AgpConfig;
  public leaves: Column[];
  public genes = [];

  public sortBy: string = "autism_gene_sets_rank";
  public orderBy: string = "desc";
  public currentSortingColumnId: string;

  public geneInput: string = null;
  public searchKeystrokes$: Subject<string> = new Subject();

  private pageIndex = 0;

  public constructor(
    private autismGeneProfilesService: AutismGeneProfilesService,
  ) { }

  public ngOnInit(): void {
    this.autismGeneProfilesService.getConfig().pipe(take(1)).subscribe(config => {
      this.config = config;
      this.calculateHeaderLayout();
      this.updateGenes();
    });

    this.searchKeystrokes$.pipe(
      debounceTime(250),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.search(searchTerm);
    });
  }

  private calculateHeaderLayout(): void {
    this.leaves = Column.leaves(this.config.columns);
    let columnIdx = 1;
    const maxDepth: number = Math.max(...this.leaves.map(leaf => leaf.depth));

    for (const leaf of this.leaves) {
      leaf.gridColumn = (columnIdx + 1).toString();
      Column.calculateGridRow(leaf, maxDepth);
      columnIdx++;
    }

    for (const column of this.config.columns) {
      Column.calculateGridColumn(column);
    }
  }

  public search(value: string): void {
    this.geneInput = value;
    this.genes = [];
    this.pageIndex = 0;

    this.updateGenes();
  }

  public updateGenes(): void {
    this.pageIndex++;

    this.autismGeneProfilesService
      .getGenes(this.pageIndex, this.geneInput, this.sortBy, this.orderBy)
      .pipe(take(1))
      .subscribe(res => {
        this.genes = this.genes.concat(res);
      });
  }

  public createMultiSelectMenuSource(column: Column): { itemIds: string[]; shownItemIds: string[] } {
    const allNames = column.columns.map(col => col.displayName);
    const shownNames = column.columns.filter(col => col.visibility).map(col => col.displayName);
    return { itemIds: allNames, shownItemIds: shownNames };
  }

  public openDropdown(column: Column): void {
    this.multipleSelectMenuComponent.menuId = column.id;
    this.multipleSelectMenuComponent.itemsSource = this.createMultiSelectMenuSource(column);

    this.waitForDropdown()
      .then(() => {
        this.ngbDropdownMenu.dropdown.open();
        this.multipleSelectMenuComponent.refresh();
      })
      .catch(err => console.error(err));
  }

  public async waitForDropdown(): Promise<void> {
    return new Promise<void>(resolve => {
      const timer = setInterval(() => {
        if (this.ngbDropdownMenu !== undefined) {
          resolve();
          clearInterval(timer);
        }
      }, 15);
    });
  }

  public filterColumns($event: ItemApplyEvent): void {
    const menuId = $event.menuId.split('.');

    // Find column for filtering
    let column: Column = this.config.columns.find(col => col.id === menuId[0]);
    for (let i = 1; i < menuId.length; i++) {
      menuId[i] = `${ menuId[i-1] }.${ menuId[i] }`;
      column = column.columns.find(col => col.id === menuId[i]);
    }

    // Sort sub-columns according to the new order
    column.columns.sort((a, b) => $event.order.indexOf(a.displayName) - $event.order.indexOf(b.displayName));

    // Toggle sub-columns visibility according to the new selected
    column.columns.forEach(col => col.visibility = $event.selected.indexOf(col.displayName) !== -1);

    this.calculateHeaderLayout();
    this.ngbDropdownMenu.dropdown.close();
  }

  public sort(sortBy: string, orderBy?: string): void {
    if (this.currentSortingColumnId !== sortBy) {
      this.resetSortButtons(sortBy);
    }

    this.sortBy = sortBy;
    if (orderBy) {
      this.orderBy = orderBy;
    }
    this.genes = [];
    this.pageIndex = 0;

    this.updateGenes();
  }

  public resetSortButtons(sortBy: string): void {
    if (this.currentSortingColumnId !== undefined) {
      const sortButton = this.sortingButtonsComponents.find(
        sortingButtonsComponent => {
          return sortingButtonsComponent.id === this.currentSortingColumnId;
        }
      );

      if (sortButton) {
        sortButton.resetHideState();
      }
    }
    this.currentSortingColumnId = sortBy;
  }

  public highlightRow(idx: number): void {
    document.getElementById(`row-${idx}`).classList.toggle('row-highlight');
  }
}
