import { UsersService } from '../users/users.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { DatasetsService } from './datasets.service';
import { Dataset, toolPageLinks } from './datasets';
import { Subscription, combineLatest } from 'rxjs';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { isEmpty } from 'lodash';
import { DatasetNode } from 'app/dataset-node/dataset-node';
import { Store } from '@ngxs/store';
import { StateResetAll } from 'ngxs-reset-plugin';

@Component({
  selector: 'gpf-datasets',
  templateUrl: './datasets.component.html',
  styleUrls: ['./datasets.component.css'],
})
export class DatasetsComponent implements OnInit, OnDestroy {
  private static previousUrl = '';
  public registerAlertVisible = false;
  public datasetTrees: DatasetNode[];
  public selectedDataset: Dataset;
  public permissionDeniedPrompt: string;
  public toolPageLinks = toolPageLinks;
  public visibleDatasets: string[];
  private subscriptions: Subscription[] = [];

  public selectedTool: string;

  public constructor(
    private usersService: UsersService,
    private datasetsService: DatasetsService,
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
  ) { }

  public ngOnInit(): void {
    this.datasetTrees = new Array<DatasetNode>();
    this.subscriptions.push(
      this.route.params.subscribe((params: Params) => {
        if (isEmpty(params)) {
          return;
        }
        // Clear out previous loaded dataset - signifies loading and triggers change detection
        this.selectedDataset = null;
        this.datasetsService.setSelectedDatasetById(params['dataset'] as string);
      }),
      // Create dataset hierarchy
      combineLatest({
        datasets: this.datasetsService.getDatasetsObservable(),
        visibleDatasets: this.datasetsService.getVisibleDatasets()
      }).subscribe(({datasets, visibleDatasets}) => {
        this.visibleDatasets = visibleDatasets as string[];
        this.datasetTrees = new Array<DatasetNode>();
        datasets = datasets
          .filter(d => d.groups.find((g) => g.name === 'hidden') === undefined || d.accessRights)
          .filter(d => this.visibleDatasets.includes(d.id));
        datasets
          .sort((a, b) => this.visibleDatasets.indexOf(a.id) - this.visibleDatasets.indexOf(b.id))
          .filter(d => !d.parents.length)
          .map(d => this.datasetTrees.push(new DatasetNode(d, datasets)));

        if (this.router.url === '/datasets' && this.datasetTrees.length > 0) {
          this.router.navigate(['/', 'datasets', this.datasetTrees[0].dataset.id]);
        }
      }),
      this.datasetsService.getDatasetsLoadedObservable().subscribe(() => {
        this.setupSelectedDataset();
      }),
      this.usersService.getUserInfoObservable().subscribe(() => {
        this.datasetsService.reloadSelectedDataset(true);
      }),
      this.datasetsService.getPermissionDeniedPrompt().subscribe(aprompt => {
        this.permissionDeniedPrompt = aprompt;
      }),
    );
  }

  public ngOnDestroy(): void {
    this.subscriptions.map(subscription => subscription.unsubscribe());
  }

  public get datasetsLoading(): boolean {
    return this.datasetsService.datasetsLoading;
  }

  private setupSelectedDataset(): void {
    this.selectedDataset = this.datasetsService.getSelectedDataset();
    if (!this.selectedDataset) {
      return;
    }

    const firstTool = this.findFirstTool(this.selectedDataset);

    this.registerAlertVisible = !this.selectedDataset.accessRights;

    if (!this.isToolSelected()) {
      if (firstTool) {
        this.router.navigate(
          ['/', 'datasets', this.selectedDataset.id, firstTool],
          {replaceUrl: true}
        );
      } else {
        this.router.navigate(['/', 'datasets', this.selectedDataset.id]);
      }
    } else {
      const url = this.router.url.split('?')[0].split('/');
      const toolName = url[url.indexOf('datasets') + 2];

      if (!this.isToolEnabled(this.selectedDataset, toolName)) {
        this.router.navigate(['/', 'datasets', this.selectedDataset.id, firstTool]);
        this.selectedTool = firstTool;
      } else {
        this.selectedTool = toolName;
      }
    }
  }

  private isToolEnabled(dataset: Dataset, toolName: string): boolean {
    let result: boolean;
    switch (toolName) {
      case 'dataset-description':
        result = dataset.description !== undefined;
        break;
      case 'dataset-statistics':
        result = dataset.commonReport.enabled;
        break;
      case 'genotype-browser':
        result = Boolean(dataset.genotypeBrowser && (dataset.genotypeBrowserConfig !== undefined) !== false);
        break;
      case 'phenotype-browser':
        result = dataset.phenotypeBrowser;
        break;
      case 'phenotype-tool':
        result = dataset.phenotypeTool;
        break;
      case 'enrichment-tool':
        result = dataset.enrichmentTool;
        break;
      case 'gene-browser':
        result = dataset.geneBrowser.enabled;
        break;
    }

    return result;
  }

  private isToolSelected(): boolean {
    return this.router.url.split('?')[0].split('/').some(str => Object.values(toolPageLinks).includes(str));
  }

  public findFirstTool(selectedDataset: Dataset): string {
    let firstTool = '';

    if (!selectedDataset.accessRights) {
      firstTool = toolPageLinks.datasetDescription;
    } else if (selectedDataset.geneBrowser.enabled) {
      firstTool = toolPageLinks.geneBrowser;
    } else if (selectedDataset.genotypeBrowser && selectedDataset.genotypeBrowserConfig) {
      firstTool = toolPageLinks.genotypeBrowser;
    } else if (selectedDataset.phenotypeBrowser) {
      firstTool = toolPageLinks.phenotypeBrowser;
    } else if (selectedDataset.enrichmentTool) {
      firstTool = toolPageLinks.enrichmentTool;
    } else if (selectedDataset.phenotypeTool) {
      firstTool = toolPageLinks.phenotypeTool;
    } else if (selectedDataset.description) {
      firstTool = toolPageLinks.datasetDescription;
    } else if (selectedDataset.commonReport.enabled) {
      firstTool = toolPageLinks.datasetStatistics;
    }

    return firstTool;
  }

  public routeChange(): void {
    const url = this.router.url;

    /* In order to have state separation between the dataset tools,
    we clear the state if the previous url is from a different dataset tool */
    if (DatasetsComponent.previousUrl !== url && DatasetsComponent.previousUrl.startsWith('/datasets')) {
      this.store.dispatch(new StateResetAll());
    }

    this.selectedTool = url.split('/').pop();
    DatasetsComponent.previousUrl = url;
  }
}
