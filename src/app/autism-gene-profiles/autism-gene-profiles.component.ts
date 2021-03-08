import {
  AfterViewInit, Component, ElementRef, EventEmitter, HostListener,
  Input, OnChanges, OnInit, Output, ViewChild, ViewChildren
} from '@angular/core';
import { Subject } from 'rxjs';
import { AutismGeneToolConfig, AutismGeneToolGene } from './autism-gene-profile';
import { AutismGeneProfilesService } from './autism-gene-profiles.service';
import { NgbDropdownMenu } from '@ng-bootstrap/ng-bootstrap';
import { SortingButtonsComponent } from 'app/sorting-buttons/sorting-buttons.component';

@Component({
  selector: 'gpf-autism-gene-profiles',
  templateUrl: './autism-gene-profiles.component.html',
  styleUrls: ['./autism-gene-profiles.component.css'],
})
export class AutismGeneProfilesComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() config: AutismGeneToolConfig;
  @Output() createTabEvent = new EventEmitter();
  @ViewChildren(NgbDropdownMenu) ngbDropdownMenu: NgbDropdownMenu[];

  private genes: AutismGeneToolGene[] = [];
  private shownGeneSets: string[];
  private shownAutismScores: string[];
  private shownProtectionScores: string[];

  private pageIndex = 1;
  private loadMoreGenes = true;
  private scrollLoadThreshold = 1000;

  private focusGeneSetsInput: boolean;
  private focusAutismScoresInput: boolean;
  private focusProtectionScoresInput: boolean;

  geneInput: string;
  searchKeystrokes$: Subject<string> = new Subject();
  @ViewChild('geneSearchInput') geneSearchInput: ElementRef;

  sortBy: string;
  orderBy: string;
  @ViewChildren(SortingButtonsComponent) sortingButtonsComponents: SortingButtonsComponent[];
  currentSortingColumnId: string;

  bottom: number = 0;

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    const currentScrollHeight = document.documentElement.scrollTop + document.documentElement.offsetHeight;
    const totalScrollHeight = document.documentElement.scrollHeight;

    this.bottom = (document.documentElement.scrollTop / 11)

    if (this.loadMoreGenes && currentScrollHeight + this.scrollLoadThreshold >= totalScrollHeight) {
      this.updateGenes();
    }
  }

  constructor(
    private autismGeneProfilesService: AutismGeneProfilesService,
  ) { }

  ngOnChanges(): void {
    if (this.config) {
      this.shownGeneSets = this.config['geneSets'];
      this.shownAutismScores = this.config['autismScores'];
      this.shownProtectionScores = this.config['protectionScores'];
    }
  }

  ngOnInit(): void {
    this.autismGeneProfilesService.getGenes(this.pageIndex).take(1).subscribe(res => {
      this.genes = this.genes.concat(res);
    });

    this.searchKeystrokes$
      .debounceTime(250)
      .distinctUntilChanged()
      .subscribe(searchTerm => {
        this.search(searchTerm);
      });
  }

  ngAfterViewInit(): void {
    this.focusGeneSearch();
  }

  calculateDatasetColspan(datasetConfig) {
    return datasetConfig.effects.length * datasetConfig.personSets.length;
  }

  getMapValues(map: Map<string, number>) {
    return Array.from(map.values());
  }

  handleMultipleSelectMenuApplyEvent($event) {
    if ($event.id === 'geneSets') {
      this.shownGeneSets = $event.data;
    } else if ($event.id === 'autismScores') {
      this.shownAutismScores = $event.data;
    } else if ($event.id === 'protectionScores') {
      this.shownProtectionScores = $event.data;
    }

    this.ngbDropdownMenu.forEach(menu => menu.dropdown.close());
  }

  emitCreateTabEvent(geneSymbol: string, openTab: boolean): void {
    this.createTabEvent.emit({geneSymbol: geneSymbol, openTab: openTab});
  }

  updateGenes() {
    this.loadMoreGenes = false;
    this.pageIndex++;

    this.autismGeneProfilesService
    .getGenes(this.pageIndex, this.geneInput, this.sortBy, this.orderBy)
    .take(1).subscribe(res => {
        this.genes = this.genes.concat(res);
        this.loadMoreGenes = Object.keys(res).length !== 0 ? true : false;
    });
  }

  search(value: string) {
    this.geneInput = value;
    this.genes = [];
    this.pageIndex = 0;

    this.updateGenes();
  }

  sendKeystrokes(value: string) {
    this.searchKeystrokes$.next(value);
  }

  async waitForGeneSearchToLoad() {
    return new Promise<void>(resolve => {
      const timer = setInterval(() => {
        if (this.geneSearchInput !== undefined) {
          resolve();
          clearInterval(timer);
        }
      }, 100);
    });
  }

  focusGeneSearch() {
    this.waitForGeneSearchToLoad().then(() => {
      this.geneSearchInput.nativeElement.focus();
    });
  }

  sort(sortBy: string, orderBy?: string) {
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

  resetSortButtons(sortBy: string) {
    if (this.currentSortingColumnId !== undefined) {
      this.sortingButtonsComponents.find(
        sortingButtonsComponent => sortingButtonsComponent.id === this.currentSortingColumnId
      ).resetHideState();
    } 
    this.currentSortingColumnId = sortBy;
  }

  openDropdown(dropdownId: string) {
    this.ngbDropdownMenu.find(ele => ele.nativeElement.id === dropdownId).dropdown.open();
  }

  calculateColumnSize(columnsCount: number): string {
    let result: number;
    const singleColumnSize = 80;

    if (columnsCount === 1) {
      result = 200;
    } else {
      result = columnsCount * singleColumnSize;
    }

    return result + 'px';
  }
}
