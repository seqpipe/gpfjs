import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { NgbNav } from '@ng-bootstrap/ng-bootstrap';
import { AgpSingleViewConfig } from 'app/autism-gene-profiles-single-view/autism-gene-profile-single-view';
import { AutismGeneProfilesService  } from 'app/autism-gene-profiles-block/autism-gene-profiles.service';
import { take } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { QueryService } from 'app/query/query.service';
import { AutismGeneProfileSingleViewComponent } from 'app/autism-gene-profiles-single-view/autism-gene-profile-single-view.component';
import { AgpTableConfig } from 'app/autism-gene-profiles-table/autism-gene-profiles-table';
import { AgpTableService } from 'app/autism-gene-profiles-table/autism-gene-profiles-table.service';

@Component({
  selector: 'gpf-autism-gene-profiles-block',
  templateUrl: './autism-gene-profiles-block.component.html',
  styleUrls: ['./autism-gene-profiles-block.component.css']
})
export class AutismGeneProfilesBlockComponent implements OnInit {
  @ViewChild('nav') public nav: NgbNav;

  public geneTabs = new Set<string>();
  public maxTabCount = 20;
  public agpTableConfig: AgpTableConfig;
  public agpSingleViewConfig: AgpSingleViewConfig;

  public showKeybinds = false;
  private keybinds = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'q', 'p',
    'e', 'n',
    'w'
  ];

  public constructor(
    private location: Location,
    private agpTableService: AgpTableService,
    private autismGeneProfilesService: AutismGeneProfilesService,
    private queryService: QueryService,
    private store: Store
  ) { }

  @HostListener('window:keydown.home')
  public scrollToTop(): void {
    window.scrollTo(0, 0);
  }

  @HostListener('window:keydown.end')
  public scrollToBottom(): void {
    window.scrollTo(0, document.body.scrollHeight || document.documentElement.scrollHeight);
  }

  @HostListener('window:keydown', ['$event'])
  public keyEvent($event: KeyboardEvent): void {
    if (
      $event.target['localName'] === 'input'
      || !this.keybinds.includes($event.key)
      || $event.altKey
      || $event.ctrlKey
    ) {
      return;
    }

    const key = $event.key;
    if (key === 'w') {
      this.closeActiveTab();
    } else {
      this.openTabByKey(key);
    }
  }

  public ngOnInit(): void {
    this.agpTableService.getConfig().pipe(take(1)).subscribe(config => {
      this.agpTableConfig = config;
    });
    this.autismGeneProfilesService.getConfig().pipe(take(1)).subscribe(config => {
      this.agpSingleViewConfig = config;
    });
  }

  public createTabEventHandler($event: { geneSymbols: string[]; navigateToTab: boolean }): void {
    if (this.geneTabs.size >= this.maxTabCount) {
      window.scroll(0, 0);
      return;
    }

    const tabId: string = $event.geneSymbols.sort().toString();
    const navigateToTab: boolean = $event.navigateToTab;

    this.geneTabs.add(tabId);
    if (navigateToTab) {
      this.selectNav(tabId);
    }
  }

  public goToQueryEventHandler($event: { geneSymbol: string; statisticId: string }): void {
    const tokens: string[] = $event.statisticId.split('.');
    const datasetId = tokens[1];
    const personSet = this.agpSingleViewConfig.datasets
      .find(ds => ds.id === datasetId).personSets
      .find(ps => ps.id === tokens[2]);
    const statistic = personSet.statistics.find(st => st.id === tokens[3]);
    AutismGeneProfileSingleViewComponent.goToQuery(this.store, this.queryService, $event.geneSymbol, personSet, datasetId, statistic);
  }

  private selectNav(navId: string) {
    this.changeUrl(navId);
    this.nav.select(navId);
  }
  
  public changeUrl(navId: string) {
    const urlPart = navId === 'autismGenesTool' ? '' : `/${navId}`;
    this.location.go(`autism-gene-profiles${urlPart}`);
  }

  public getActiveTabIndex(): number {
    return [...this.geneTabs].indexOf(this.nav.activeId);
  }

  public openHomeTab(): void {
    this.selectNav('autismGenesTool');
  }

  public openPreviousTab(): void {
    const index = this.getActiveTabIndex();

    if (index > 0) {
      this.openTabAtIndex(index - 1);
    } else {
      this.openHomeTab();
    }
  }

  public openNextTab(): void {
    const index = this.getActiveTabIndex();

    if (index + 1 < this.geneTabs.size) {
      this.openTabAtIndex(index + 1);
    }
  }

  public openLastTab(): void {
    this.selectNav([...this.geneTabs][this.geneTabs.size - 1]);
  }

  public openTabAtIndex(index: number): void {
    this.selectNav([...this.geneTabs][index]);
  }

  public closeTab(event: MouseEvent, tabId: string): void {
    if (tabId === 'autismGenesTool') {
      return;
    }

    if (this.nav.activeId === tabId) {
      this.closeActiveTab();
    } else {
      this.geneTabs.delete(tabId);
    }

    event.preventDefault();
    event.stopImmediatePropagation();
  }

  public closeActiveTab(): void {
    if (this.nav.activeId === 'autismGenesTool') {
      return;
    }

    const index = this.getActiveTabIndex();
    this.geneTabs.delete(this.nav.activeId);

    if ([...this.geneTabs].length === 0) {
      this.openHomeTab();
    } else if ([...this.geneTabs].length === index) {
      this.openLastTab();
    } else {
      this.openTabAtIndex(index);
    }
  }

  public openTabByKey(key: string): void {
    if (this.geneTabs.size === 0) {
      return;
    }

    if (key === '9') {
      this.openLastTab();
    } else if (key === '1') {
      this.openHomeTab();
    } else if (Number(key) - 1 <= this.geneTabs.size) {
      this.openTabAtIndex(Number(key) - 2);
    } else if (key === 'p' || key === 'q') {
      this.openPreviousTab();
    } else if (key === 'n' || key === 'e') {
      this.openNextTab();
    }
  }
}
