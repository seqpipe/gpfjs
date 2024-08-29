import { Component, OnInit } from '@angular/core';
import { DatasetsService } from '../datasets/datasets.service';
import { switchMap, take } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { DatasetHierarchy } from 'app/datasets/datasets';
import { zip } from 'rxjs';
import { selectDatasetId } from 'app/datasets/datasets.state';

@Component({
  selector: 'gpf-dataset-description',
  templateUrl: './dataset-description.component.html',
  styleUrls: ['./dataset-description.component.css']
})
export class DatasetDescriptionComponent implements OnInit {
  public descriptionHierarchy: DatasetHierarchy;
  public editable: boolean;


  public constructor(
    private datasetsService: DatasetsService,
    private store: Store
  ) { }

  public ngOnInit(): void {
    const subscription = this.store.select(selectDatasetId).pipe(
      switchMap(datasetIdState => this.datasetsService.getDataset(datasetIdState)),
      switchMap(dataset => {
        this.editable = dataset.descriptionEditable;
        return zip(
          this.datasetsService.getSingleDatasetHierarchy(dataset.id),
          this.datasetsService.getVisibleDatasets()
        );
      }))
      .subscribe(([hierarchy, visibleDatasets]: [DatasetHierarchy, string[]]) => {
        this.setDescriptionsAndVisibility(hierarchy, visibleDatasets);
        this.descriptionHierarchy = hierarchy;
        subscription.unsubscribe();
      });
  }

  public setDescriptionsAndVisibility(hierarchy: DatasetHierarchy, visibleDatasets: string[]): void {
    const subscription = this.datasetsService.getDatasetDescription(hierarchy.id)
      .subscribe(desc => {
        if (visibleDatasets.includes(hierarchy.id)) {
          hierarchy.description = desc;
          hierarchy.visibility = true;
        }
        subscription.unsubscribe();
      });

    for (const child of hierarchy.children) {
      this.setDescriptionsAndVisibility(child, visibleDatasets);
    }
  }

  public getFirstParagraph(text: string): string {
    const paragraphs = text.split('\n\n');

    let result = '';
    if (paragraphs[0].startsWith('#')) {
      const regexp = new RegExp(/^##((?:\n|.)*?)$\n/);
      if (regexp.test(paragraphs[0])) {
        result = paragraphs[0].replace(regexp, '');
      } else {
        result = paragraphs[1];
      }
    } else {
      result = paragraphs[0];
    }

    return result.replace('\n', ' ').trim();
  }

  public writeDataset(datasetId: string, text: string): void {
    this.datasetsService.writeDatasetDescription(datasetId, text).pipe(take(1)).subscribe();
  }
}
