import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { NgbNav } from '@ng-bootstrap/ng-bootstrap';
import { AutismGeneToolConfig } from 'app/autism-gene-profiles/autism-gene-profile';
import { AutismGeneProfilesService } from 'app/autism-gene-profiles/autism-gene-profiles.service';

@Component({
  selector: 'gpf-autism-gene-profiles-block',
  templateUrl: './autism-gene-profiles-block.component.html',
  styleUrls: ['./autism-gene-profiles-block.component.css']
})
export class AutismGeneProfilesBlockComponent implements OnInit {
  @ViewChild('nav') nav: NgbNav;
  private geneTabs = new Set<string>();
  private autismGeneToolConfig: AutismGeneToolConfig;

  @HostListener('window:keydown', ['$event'])
  keyEvent($event: KeyboardEvent) {
    if ($event.key === 'w') {
      this.closeCurrentTab();
    }

    if (Number($event.key) || $event.key === '0' || $event.key === '`') {
      this.openTabByKey($event.key);
    }
  }

  constructor(
    private autismGeneProfilesService: AutismGeneProfilesService,
  ) { }

  ngOnInit(): void {
    this.autismGeneProfilesService.getConfig().take(1).subscribe(config => {
      this.autismGeneToolConfig = config;
    });
  }

  openTabEventHandler($event) {
    this.geneTabs.add($event);
  }

  close(event: MouseEvent, toRemove: string) {
    this.geneTabs.delete(toRemove);
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  closeCurrentTab() {
    if (this.nav.activeId === 'autismGenesTool') {
      return;
    }

    const index = [...this.geneTabs].indexOf(this.nav.activeId);
    this.geneTabs.delete(this.nav.activeId);

    if (index !== 0) {
      this.nav.select([...this.geneTabs][index - 1]);
    } else if (this.geneTabs.size !== 0) {
      this.nav.select([...this.geneTabs][index]);

    } else {
      this.nav.select('autismGenesTool');
    }
  }

  openTabByKey(key) {
    if (this.geneTabs.size === 0) {
      return;
    }

    if (key === '0') {
      this.nav.select([...this.geneTabs][this.geneTabs.size - 1]);
    } else if (key === '1' || key === '`') {
      this.nav.select('autismGenesTool');
    } else if (Number(key) - 1 <= this.geneTabs.size) {
      this.nav.select([...this.geneTabs][Number(key) - 2]);
    }
  }
}
