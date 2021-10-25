import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// eslint-disable-next-line no-restricted-imports
import { Observable } from 'rxjs';

import { ConfigService } from '../config/config.service';
import { IdDescription } from 'app/common/iddescription';
import { map } from 'rxjs/operators';

export interface EnrichmentModels {
  countings: IdDescription[];
  backgrounds: IdDescription[];
}

@Injectable()
export class EnrichmentModelsService {
  private readonly enrichmentModelsUrl = 'enrichment/models';

  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) {}

  getBackgroundModels(datasetId: String): Observable<EnrichmentModels> {
    const url = `${this.config.baseUrl}${this.enrichmentModelsUrl}/${datasetId}`;

    return this.http
      .get(url)
      .pipe(map(res => {
        return {
          countings: res['counting'].map((j) => new IdDescription(j.name, j.desc)),
          backgrounds: res['background'].map((j) => new IdDescription(j.name, j.desc)),
        }
      }));
  }
}
