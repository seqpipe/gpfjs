import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { ConfigService } from 'app/config/config.service';
import { DatasetsService } from 'app/datasets/datasets.service';
import { FullscreenLoadingService } from 'app/fullscreen-loading/fullscreen-loading.service';
import { UsersService } from 'app/users/users.service';
import { PhenoToolComponent } from './pheno-tool.component';
import { PhenoToolService } from './pheno-tool.service';
import { ErrorsState } from 'app/common/errors.state';
import { GenesBlockComponent } from 'app/genes-block/genes-block.component';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { PhenoToolMeasureComponent } from 'app/pheno-tool-measure/pheno-tool-measure.component';
import { MeasuresService } from 'app/measures/measures.service';
import { GeneSymbolsComponent } from 'app/gene-symbols/gene-symbols.component';
import { GeneSymbolsState, SetGeneSymbols } from 'app/gene-symbols/gene-symbols.state';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import * as downloadBlobResponse from 'app/utils/blob-download';

class PhenoToolServiceMock {
  public getPhenoToolResults(): Observable<string> {
    return of('fakeValue');
  }

  public downloadPhenoToolResults(): Observable<HttpResponse<Blob>> {
    return of([] as any);
  }
}
class MockDatasetsService {
  public getSelectedDataset = (): object => ({accessRights: true, id: 'testDatasetId'});
}

describe('PhenoToolComponent', () => {
  let component: PhenoToolComponent;
  let fixture: ComponentFixture<PhenoToolComponent>;
  let store: Store;
  const phenoToolMockService = new PhenoToolServiceMock();

  beforeEach(waitForAsync(() => {
    const configMock = { baseUrl: 'testUrl/' };
    TestBed.configureTestingModule({
      declarations: [
        PhenoToolComponent,
        GenesBlockComponent,
        GeneSymbolsComponent,
        PhenoToolMeasureComponent,
      ],
      providers: [
        {provide: ActivatedRoute, useValue: new ActivatedRoute()},
        {provide: DatasetsService, useValue: new MockDatasetsService()},
        {provide: ConfigService, useValue: configMock},
        {provide: PhenoToolService, useValue: phenoToolMockService},
        UsersService,
        FullscreenLoadingService,
        MeasuresService,
      ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        NgxsModule.forRoot([ErrorsState, GeneSymbolsState], {developmentMode: true}),
        NgbNavModule
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();
    store = TestBed.inject(Store);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PhenoToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should test state selector', () => {
    const mockStateSelector = PhenoToolComponent.phenoToolStateSelector({
      genesBlockState: 'state1',
      testGene: 'test1'
    }, {
      measureState: 'state2',
      testMeasure: 'test2'
    }, {
      genotypeState: 'state3',
      testGeno: 'test3'
    }, {
      familyFilterState: 'state4',
      testFamily: 'test4'
    });

    expect(mockStateSelector).toEqual(
      Object({
        genesBlockState: 'state1',
        testGene: 'test1',
        measureState: 'state2',
        testMeasure: 'test2',
        genotypeState: 'state3',
        testGeno: 'test3',
        familyFilterState: 'state4',
        testFamily: 'test4'
      })
    );
  });

  it('should test submit query', () => {
    fixture.detectChanges();
    component.submitQuery();
    expect(component.phenoToolResults).toEqual('fakeValue' as any);
  });

  it('should hide results on a state change', () => {
    fixture.detectChanges();
    component.submitQuery();
    expect(component.phenoToolResults).toEqual('fakeValue' as any);
    store.dispatch(new SetGeneSymbols(['POGZ']));
    expect(component.phenoToolResults).toEqual(null);
  });

  it('should test download', () => {
    const spy = jest.spyOn(component, 'onDownload');
    const spyOnQueryService = jest.spyOn<any, any>(phenoToolMockService, 'downloadPhenoToolResults');
    const spyOnBlobResponse = jest.spyOn(downloadBlobResponse, 'downloadBlobResponse');
    component.onDownload();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spyOnBlobResponse).toHaveBeenCalledWith([], 'pheno_report.csv');
    expect(spyOnBlobResponse).toHaveBeenCalledTimes(1);
    expect(spyOnQueryService).toHaveBeenCalledWith({datasetId: 'testDatasetId'});
    expect(spyOnQueryService).toHaveBeenCalledTimes(1);
    expect(spyOnQueryService.mock.results).toMatchObject([{type: 'return', value: {}}]);
  });
});

