/* tslint:disable:no-unused-variable */
import { Injector } from '@angular/core';
import { TestBed, getTestBed, async, inject, fakeAsync, tick } from '@angular/core/testing';
import { DatasetService } from './dataset.service';
import { IdDescription } from '../common/iddescription';
import { IdName } from '../common/idname';
import { Dataset } from '../dataset/dataset';
import { ConfigService } from '../config/config.service';

import {
  BaseRequestOptions, Http, HttpModule, XHRBackend,
  Response, ResponseOptions
} from '@angular/http';

import { MockBackend, MockConnection } from '@angular/http/testing/mock_backend';
import { Observable } from 'rxjs';
import { gpfReducer } from '../store/gpf-store';
import { StoreModule } from '@ngrx/store';



const mockDatasetResponse: Dataset = {
  id: 'VIP',
  name: 'VIP Dataset',
  studies: ['VIP-JHC'],
  studyTypes: ['WE'],
  phenoDB: 'vip',

  phenotypeGenotypeTool: true,
  enrichmentTool: false,
  phenotypeBrowser: true,

  genotypeBrowser: {
    hasDenovo: true,
    hasCNV: false,
    hasAdvancedFamilyFilters: false,
    hasTransmitted: true,
    hasPedigreeSelector: true,
    hasStudyTypes: false,
    mainForm: 'vip'
  },
  pedigreeSelectors: [
    {
      id: '16pstatus',
      name: '16p Status',
      source: 'phenoDB.pheno_common.genetic_status_16p',
      defaultValue: {
        color: '#aaaaaa',
        id: 'unknown',
        name: 'unknown'
      },
      domain: [
        {
          color: '#e35252',
          id: 'deletion',
          name: 'deletion'
        },
        {
          color: '#b8008a',
          id: 'duplication',
          name: 'duplication'
        },
        {
          color: '#e3d252',
          id: 'triplication',
          name: 'triplication'
        },
        {
          color: '#ffffff',
          id: 'negative',
          name: 'negative'
        }
      ]
    },
    {
      id: 'phenotypes',
      name: 'Phenotypes',
      source: 'legacy',
      defaultValue: {
        color: '#aaaaaa',
        id: 'unknown',
        name: 'unknown'
      },
      domain: [
        {
          color: '#e35252',
          id: 'autism',
          name: 'autism'
        },
        {
          color: '#ffffff',
          id: 'unaffected',
          name: 'unaffected'
        }
      ]
    }
  ]
};


export class DatasetServiceStub {

  getDatasets(): Observable<Dataset[]> {
    return Observable.of([mockDatasetResponse]);
  }

  getDataset(datasetId: string): Observable<Dataset> {
    return Observable.of(mockDatasetResponse);
  }

  setSelectedDataset(dataset: Dataset): void {
    console.log('setSelectedDataset() called...');
    //    this.store.dispatch({
    //      'type': DATASETS_SELECT,
    //      'payload': dataset
    //
    //    });
    // this.selectedDataset.next(dataset);
  }


}

describe('DatasetService', () => {
  let mockBackend: MockBackend;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        ConfigService,
        DatasetService,

        MockBackend,
        BaseRequestOptions,
        {
          provide: Http,
          deps: [MockBackend, BaseRequestOptions],
          useFactory:
          (backend: XHRBackend, defaultOptions: BaseRequestOptions) => {
            return new Http(backend, defaultOptions);
          }
        }
      ],
      imports: [
        HttpModule,
        StoreModule.provideStore(gpfReducer),
      ],

    });
    getTestBed().compileComponents();
    mockBackend = getTestBed().get(MockBackend);
  }));

  it('getDatasets() should parse correct response',
    async(inject([DatasetService], (service) => {

      mockBackend.connections.subscribe(
        (conn: MockConnection) => {
          conn.mockRespond(
            new Response(
              new ResponseOptions(
                {
                  body: JSON.stringify({ data: [mockDatasetResponse] })
                }
              )));
        });

      service.getDatasets().subscribe(res => {
        expect(res.length).toBe(1);
        expect(res[0].id).toEqual('VIP');
      });
    })
    )
  );

  it('getDataset() should parse correct response',
    async(inject([DatasetService], (service) => {

      mockBackend.connections.subscribe(
        (conn: MockConnection) => {
          conn.mockRespond(
            new Response(
              new ResponseOptions(
                {
                  body: JSON.stringify({ data: mockDatasetResponse })
                }
              )));
        });

      service.getDataset('VIP').subscribe(res => {
        expect(res.id).toEqual('VIP');
        expect(res.pedigreeSelectors.length).toBe(2);
      });

    })
    )
  );



});

