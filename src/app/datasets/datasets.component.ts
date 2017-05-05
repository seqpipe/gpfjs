import {
  UsersState
} from '../users/users-store';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { DatasetsService } from './datasets.service';
import { Dataset, DatasetsState } from './datasets';

import { IdName } from '../common/idname';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { ActivatedRoute, Params, Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'gpf-datasets',
  templateUrl: './datasets.component.html',
  styleUrls: ['./datasets.component.css']
})
export class DatasetsComponent implements OnInit {
  registerAlertVisible = false;
  datasets: Dataset[];
  selectedDataset: Dataset;
  @Output() selectedDatasetChange = new EventEmitter<Dataset>();

  usersState: Observable<UsersState>;

  selectedDatasetId: string;

  constructor(
    private store: Store<any>,
    private datasetsService: DatasetsService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {
    this.usersState = this.store.select('users');
  }

  ngOnInit() {
    this.route.params.subscribe(
      (params: Params) => {
        this.selectedDatasetId = params['dataset'];
        this.selectDatasetById();
      }
    );

    this.usersState.subscribe(
      state => {
        this.datasetsService.getDatasets().subscribe(
          (datasets) => {
            console.log(datasets);
            this.datasets = datasets;
            this.selectDatasetById();
          });
      }
    );
  }

  selectDatasetById() {
    if (!this.datasets) {
      return;
    }

    if (!this.selectedDatasetId) {
      this.router.navigate([this.datasets[0].id], { relativeTo: this.route });
    }

    for (let idx in this.datasets) {
      if (this.datasets[idx].id === this.selectedDatasetId) {
        this.selectDataset(+idx);
        return;
      }
    }
  }

  selectDataset(index: number): void {
    if (index >= 0 && index < this.datasets.length) {
      this.selectedDataset = this.datasets[index];
      if (this.datasets[index].accessRights) {
        this.datasetsService.setSelectedDataset(this.selectedDataset);
        this.registerAlertVisible = false;
        this.selectedDatasetChange.emit(this.selectedDataset);
      } else {
        this.registerAlertVisible = true;
      }
    }
  }
}
