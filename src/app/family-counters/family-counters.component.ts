import { Component, OnInit, Input, AfterViewInit, OnDestroy, SimpleChanges } from '@angular/core';

import { Observable, Subject } from 'rxjs';

import { FamilyObjectArray, FamilyObject } from './family-counters';
import { FamilyCountersService } from './family-counters.service';

@Component({
  selector: 'gpf-family-counters',
  templateUrl: './family-counters.component.html',
  styleUrls: ['./family-counters.component.css']
})
export class FamilyCountersComponent implements AfterViewInit {
  private genotypeBrowserStateChange = new Subject<Object>();
  familyObjectArray: Observable<FamilyObjectArray>;

  constructor(
    private familyCountersService: FamilyCountersService
  ) {
  }

  ngAfterViewInit() {
    this.familyObjectArray = this.genotypeBrowserStateChange
      .distinctUntilChanged()
      .debounceTime(300)
      .switchMap((genotypeBrowserState) => {
        return this.familyCountersService.getCounters(genotypeBrowserState)
      });
  }

  @Input()
  set genotypeBrowserState(genotypeBrowserState) {
    this.genotypeBrowserStateChange.next(genotypeBrowserState);
  }

  shouldInvert(familyObject: FamilyObject): boolean {
    return familyObject.color !== '#ffffff' && familyObject.color !== '#e3d252';
  }

}
