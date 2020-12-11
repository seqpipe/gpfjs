import { UsersService } from '../users/users.service';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { DatasetsService } from './datasets.service';
import { Dataset } from './datasets';

// tslint:disable-next-line:import-blacklist
import { Observable } from 'rxjs';

import { ActivatedRoute, Params, Router } from '@angular/router';
import { Location } from '@angular/common';
import * as _ from 'lodash';

@Component({
  selector: 'gpf-datasets',
  templateUrl: './datasets.component.html',
  styleUrls: ['./datasets.component.css'],
})
export class DatasetsComponent implements OnInit {
  registerAlertVisible = false;
  datasets$: Observable<Dataset[]>;
  datasetTrees: Dataset[];
  selectedDataset$: Observable<Dataset>;
  permissionDeniedPrompt: string;
  @Output() selectedDatasetChange = new EventEmitter<Dataset>();

  constructor(
    private usersService: UsersService,
    private datasetsService: DatasetsService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
  ) { }

  ngOnInit() {
    this.route.params.subscribe(
      (params: Params) => {
        this.datasetsService.setSelectedDatasetById(params['dataset']);
      });

    this.datasets$ = this.filterHiddenGroups(
      this.datasetsService.getDatasetsObservable());

    this.createDatasetHierarchy();
    this.selectedDataset$ = this.datasetsService.getSelectedDataset();

    this.datasets$
      .take(1)
      .subscribe(datasets => {
        if (!this.datasetsService.hasSelectedDataset()) {
          this.selectDataset(datasets[0]);
        }
      });

    this.usersService.getUserInfoObservable()
      .subscribe(_ => {
        this.datasetsService.reloadSelectedDataset();
      });

    this.selectedDataset$
      .subscribe(selectedDataset => {
        if (!selectedDataset) {
          return;
        }
        this.registerAlertVisible = !selectedDataset.accessRights;
        if (selectedDataset.accessRights) {
          this.selectedDatasetChange.emit(selectedDataset);
        }
      });

    this.datasetsService.getPermissionDeniedPrompt().subscribe(
      aprompt => this.permissionDeniedPrompt = aprompt
    );
  }

  findFirstTool(selectedDataset: Dataset) {
    if (selectedDataset.description) {
      return 'description';
    } else if (selectedDataset.commonReport['enabled']) {
      return 'commonReport';
    } else if (selectedDataset.genotypeBrowser && selectedDataset.genotypeBrowserConfig) {
      return 'browser';
    } else if (selectedDataset.phenotypeBrowser) {
      return 'phenotypeBrowser';
    } else if (selectedDataset.enrichmentTool) {
      return 'enrichment';
    } else if (selectedDataset.phenotypeTool) {
      return 'phenoTool';
    } else {
      return '';
    }
  }

  createDatasetHierarchy() {
    this.datasets$.subscribe((datasets) => {
      this.datasetTrees = new Array<Dataset>();
      const mainDatasets = new Array<Dataset>();
      datasets.forEach(d => {
        d['indent'] = '0px';
        if (!d.parents.length) {
          mainDatasets.push(d);
        }
      });
      mainDatasets.forEach(d => this.createDatasetTree(d, datasets, 0))
    });
  }

  createDatasetTree(current: Dataset, datasets: Dataset[], indent: number) {
    current['indent'] = `${indent}px`;
    this.datasetTrees.push(_.cloneDeep(current));

    indent += 25;

    if (current.studies === null) {
      return;
    } else {
      datasets.filter(d => current.studies.indexOf(d.id) !== -1).forEach(d => this.createDatasetTree(d, datasets, indent));
    }
  }

  filterHiddenGroups(datasets: Observable<Dataset[]>): Observable<Dataset[]> {
    return datasets.map(datasets =>
      datasets.filter(dataset =>
        dataset.groups.find(g => g.name === 'hidden') == null || dataset.accessRights));
  }

  selectDataset(dataset: Dataset) {
    if (dataset !== undefined) {
      this.router.navigate(['/', 'datasets', dataset.id, this.findFirstTool(dataset)]);
    }
  }
}
