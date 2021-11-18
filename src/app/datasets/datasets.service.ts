import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
// eslint-disable-next-line no-restricted-imports
import { Observable, ReplaySubject, BehaviorSubject, zip, Subject } from 'rxjs';

import { Dataset } from '../datasets/datasets';
import { UsersService } from '../users/users.service';
import { ConfigService } from '../config/config.service';
import { distinctUntilChanged, map, take } from 'rxjs/operators';

@Injectable()
export class DatasetsService {
  private readonly datasetUrl = 'datasets';
  private readonly permissionDeniedPromptUrl = 'datasets/denied_prompt';
  private readonly datasetsDetailsUrl = 'datasets/details';
  private readonly datasetPedigreeUrl = 'datasets/pedigree';

  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  private datasets$ = new ReplaySubject<Array<Dataset>>(1);
  private selectedDataset$ = new BehaviorSubject<Dataset>(null);
  private datasetLoaded$ = new Subject<void>();
  public datasetsLoading = false;

  constructor(
    private http: HttpClient,
    private config: ConfigService,
    private usersService: UsersService
  ) {
    this.usersService.getUserInfoObservable().pipe(
      map(user => user.email || ''),
      distinctUntilChanged()
    ).subscribe(() => {
      this.reloadAllDatasets();
    });
  }

  public getDatasets(): Observable<Dataset[]> {
    const options = { withCredentials: true };
    this.datasetsLoading = true;

    return this.http.get(this.config.baseUrl + this.datasetUrl, options).pipe(
      map((res: {data: Array<object>}) => {
        const datasets = Dataset.fromJsonArray(res.data);
        this.datasets$.next(datasets);
        this.datasetsLoading = false;
        return datasets;
      })
    );
  }

  public getDataset(datasetId: string): Observable<Dataset> {
    const url = `${this.datasetUrl}/${datasetId}`;
    const options = { headers: this.headers, withCredentials: true };

    const dataset$ = this.http.get(this.config.baseUrl + url, options);
    const details$ = this.http.get(`${this.config.baseUrl}${this.datasetsDetailsUrl}/${datasetId}`, options);

    return zip(dataset$, details$).pipe(map((datasetPack: [any, any]) => Dataset.fromDatasetAndDetailsJson(datasetPack[0]['data'], datasetPack[1])));
  }

  public setSelectedDatasetById(datasetId: string, force = false): void {
    if (!force && this.selectedDataset$.getValue()?.id === datasetId) {
      return;
    }
    this.getDataset(datasetId).pipe(take(1)).subscribe(dataset => {
      this.selectedDataset$.next(dataset);
      this.datasetLoaded$.next();
    });
  }

  public reloadSelectedDataset(force = false): void {
    if (this.selectedDataset$.getValue()) {
      if (force) {
        this.setSelectedDatasetById(this.getSelectedDataset().id, true);
      }
      this.datasetLoaded$.next();
    }
  }

  public getSelectedDatasetObservable(): Observable<Dataset> {
    return this.selectedDataset$.asObservable();
  }

  public getSelectedDataset(): Dataset {
    return this.selectedDataset$.getValue();
  }

  public getDatasetsObservable(): Observable<Dataset[]> {
    return this.datasets$.asObservable();
  }

  public getDatasetsLoadedObservable(): Subject<void> {
    return this.datasetLoaded$;
  }

  private reloadAllDatasets(): void {
    this.getDatasets().pipe(take(1)).subscribe(() => {});
  }

  public getPermissionDeniedPrompt() {
    const options = { withCredentials: true };

    return this.http.get(this.config.baseUrl + this.permissionDeniedPromptUrl, options).pipe(
      map((res: any) => res['data'])
    );
  }

  public getDatasetPedigreeColumnDetails(datasetId: string, column: string): Observable<Object> {
    const options = { headers: this.headers, withCredentials: true };
    return this.http.get(`${this.config.baseUrl}${this.datasetPedigreeUrl}/${datasetId}/${column}`, options);
  }
}
