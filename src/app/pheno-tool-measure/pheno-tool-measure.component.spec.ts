import { HttpClient, HttpHandler } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ConfigService } from 'app/config/config.service';
import { MeasuresService } from 'app/measures/measures.service';
import { UsersService } from 'app/users/users.service';
import { APP_BASE_HREF } from '@angular/common';

import { PhenoToolMeasureComponent } from './pheno-tool-measure.component';
import { Observable, of } from 'rxjs';
import { DatasetsService } from 'app/datasets/datasets.service';
import { Store, StoreModule } from '@ngrx/store';
import { phenoToolMeasureReducer } from './pheno-tool-measure.state';
import { Dataset } from 'app/datasets/datasets';

class MockDatasetService {
  public getDatasets(): Observable<Dataset[]> {
    return of([] as Dataset[]);
  }
}

describe('PhenoToolMeasureComponent', () => {
  let component: PhenoToolMeasureComponent;
  let fixture: ComponentFixture<PhenoToolMeasureComponent>;
  let store: Store;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        PhenoToolMeasureComponent,
      ],
      providers: [
        MeasuresService,
        HttpClient,
        HttpHandler,
        ConfigService,
        UsersService,
        { provide: APP_BASE_HREF, useValue: '' },
        { provide: DatasetsService, useValue: new MockDatasetService() },

      ],
      imports: [RouterTestingModule, StoreModule.forRoot({phenoToolMeasure: phenoToolMeasureReducer})],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(PhenoToolMeasureComponent);
    component = fixture.componentInstance;

    const selectedDatasetMockModel = {selectedDatasetId: 'testId'};

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    store = TestBed.inject(Store);
    jest.spyOn(store, 'select').mockReturnValue(of(selectedDatasetMockModel));
    jest.spyOn(store, 'dispatch').mockReturnValue(null);

    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
