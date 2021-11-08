import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { NgbNav } from '@ng-bootstrap/ng-bootstrap';
import { AgpConfig } from 'app/autism-gene-profiles-table/autism-gene-profile-table';
import { AutismGeneProfilesService } from 'app/autism-gene-profiles-block/autism-gene-profiles.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'gpf-autism-gene-profiles-block',
  templateUrl: './autism-gene-profiles-block.component.html',
  styleUrls: ['./autism-gene-profiles-block.component.css']
})
export class AutismGeneProfilesBlockComponent implements OnInit {
  @ViewChild('nav') public nav: NgbNav;

  public geneTabs = new Set<string>();
  public autismGeneToolConfig: AgpConfig;

  public showKeybinds = false;
  private keybinds = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
    'q', 'p',
    'e', 'n',
    'w',
  ];

  @HostListener('window:keydown', ['$event'])
  public keyEvent($event: KeyboardEvent) {
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

  constructor(
    private autismGeneProfilesService: AutismGeneProfilesService,
  ) { }

  public ngOnInit(): void {
    this.autismGeneProfilesService.getConfig().pipe(take(1)).subscribe(config => {
      this.autismGeneToolConfig = config;
    });
  }

  public createTabEventHandler($event): void {
    const tabId: string = $event.geneSymbol;
    const navigateToTab: boolean = $event.navigateToTab;

    this.geneTabs.add(tabId);
    if (navigateToTab) {
      this.nav.select(tabId);
    }
  }

  public getActiveTabIndex(): number {
    return [...this.geneTabs].indexOf(this.nav.activeId);
  }

  public openHomeTab(): void {
    this.nav.select('autismGenesTool');
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
    this.nav.select([...this.geneTabs][this.geneTabs.size - 1]);
  }

  public openTabAtIndex(index: number): void {
    this.nav.select([...this.geneTabs][index]);
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

    if (key === '0') {
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
