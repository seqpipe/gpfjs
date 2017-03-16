import { Component, OnInit, Input, forwardRef } from '@angular/core';
import { GENES_BLOCK_TAB_DESELECT } from '../store/common';
import { Store } from '@ngrx/store';
import { QueryStateCollector } from '../query/query-state-provider'

@Component({
  selector: 'gpf-genes-block',
  templateUrl: './genes-block.component.html',
  styleUrls: ['./genes-block.component.css'],
  providers: [{provide: QueryStateCollector, useExisting: forwardRef(() => GenesBlockComponent) }]
})
export class GenesBlockComponent extends QueryStateCollector implements OnInit {
  @Input() showAllTab = true;

  constructor(
    private store: Store<any>
  ) {
    super();
  }

  ngOnInit() {
    this.store.dispatch({
      'type': GENES_BLOCK_TAB_DESELECT,
      'payload': null
    });
  }

  onTabChange(event) {
    this.store.dispatch({
      'type': GENES_BLOCK_TAB_DESELECT,
      'payload': event.activeId
    });
  }
}
