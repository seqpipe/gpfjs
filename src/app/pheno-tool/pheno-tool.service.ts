import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
// eslint-disable-next-line no-restricted-imports
import { Observable } from 'rxjs';

import { ConfigService } from '../config/config.service';
import { PhenoToolResults } from './pheno-tool-results';
import { map } from 'rxjs/operators';

@Injectable()
export class PhenoToolService {
  private readonly phenoToolUrl = 'pheno_tool';
  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  public constructor(
    private http: HttpClient,
    private config: ConfigService
  ) {}

  public getPhenoToolResults(filter: object): Observable<PhenoToolResults> {
    const headers = { 'Content-Type': 'application/json' };
    const options = { headers, withCredentials: true };

    return this.http.post(this.config.baseUrl + this.phenoToolUrl, filter, options)
      .pipe(map(res => PhenoToolResults.fromJson(res)));
  }

  public downloadPhenoToolResults(filter: object): Observable<HttpResponse<Blob>> {
    return this.http.post(
      this.config.baseUrl + this.phenoToolUrl + '/download',
      filter,
      {observe: 'response', headers: this.headers, responseType: 'blob'}
    );
  }
}
