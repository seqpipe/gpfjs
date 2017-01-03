/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { DatasetService } from './dataset.service';
import { IdDescription } from '../common/iddescription';
import { Phenotype } from '../phenotypes/phenotype';
import { Dataset } from '../dataset/dataset';
import { ConfigService } from '../config/config.service';

import {
  BaseRequestOptions, Http, HttpModule,
  Response, ResponseOptions
} from '@angular/http';

import { MockBackend } from '@angular/http/testing';
import { Observable } from 'rxjs';


export class DatasetServiceStub extends DatasetService {
  selectedDatasetId: string;
  getDatasets(): Promise<IdDescription[]> {
    return Promise.resolve([
      {
        id: 'ssc',
        description: 'SSC Description'
      },
      {
        id: 'vip',
        description: 'VIP Dataset'
      }
    ]);
  }

  getDataset(datasetId: string): Promise<Dataset> {
    return Promise.resolve({
      id: 'ssc',
      description: 'SSC Dataset',
      hasDenovo: true,
      hasTransmitted: true,
      hasCnv: true
    });
  }

  getPhenotypes(): Promise<Phenotype[]> {
    return Promise.resolve([
      {
        id: 'autism',
        description: 'autism',
        color: '#e35252'
      },
      {
        id: 'unaffected',
        description: 'unaffected',
        color: '#ffffff'
      }
    ]);
  }
}


describe('DatasetService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ConfigService,
        DatasetService,
        MockBackend,
        BaseRequestOptions,
        {
          provide: Http,
          deps: [MockBackend, BaseRequestOptions],
          useFactory: (backend, options) => { return new Http(backend, options); }
        }]
    });
  });

  it('should ...', inject([DatasetService], (service: DatasetService) => {
    expect(service).toBeTruthy();
  }));

  it('should construct dataset service', async(inject(
    [DatasetService, MockBackend], (service, mockBackend) => {

      expect(service).toBeDefined();
    })));

  const mockDatasetResponse: Dataset[] = [
    {
      id: 'ssc',
      description: 'SSC Dataset',
      hasDenovo: true,
      hasTransmitted: true,
      hasCnv: true,
    }
  ];

  const mockPhenotypeResponse: Phenotype[] =
    [
      {
        id: 'autism',
        description: 'autism',
        color: '#e35252'
      },
      {
        id: 'unaffected',
        description: 'unaffected',
        color: '#ffffff'
      }
    ];
  describe('getDatasets', () => {
    it('should parse correct response', async(inject(
      [DatasetService, MockBackend], (service, mockBackend) => {

        mockBackend.connections.subscribe(conn => {
          conn.mockRespond(
            new Response(new ResponseOptions(
              { body: { data: JSON.stringify(mockDatasetResponse) } }
            )));
        });

        const result: Promise<IdDescription[]> = service.getDatasets();

        result.then(res => {
          expect(res.length).toEqual(1);
        });
      })));

    it('should handle bad response', async(inject(
      [DatasetService, MockBackend], (service, mockBackend) => {

        mockBackend.connections.subscribe(conn => {
          conn.mockRespond(
            new Response(new ResponseOptions(
              { body: '"ala bala"' }
            )));
        });

        const result: Promise<IdDescription[]> = service.getDatasets();
        result.then(res => {
          expect(res.length).toEqual(0);
        });
      })));

    it('should handle bad response 1', async(inject(
      [DatasetService, MockBackend], (service, mockBackend) => {

        mockBackend.connections.subscribe(conn => {
          conn.mockRespond(
            new Response(new ResponseOptions(
              { body: '{"data": "ala bala"}' }
            )));
        });

        const result: Promise<IdDescription[]> = service.getDatasets();
        result.then(res => {
          expect(res.length).toEqual(0);
        });
      })));

  });

  describe('getDataset', () => {
    it('should parse correct dataset response', async(inject(
      [DatasetService, MockBackend], (service, mockBackend) => {

        mockBackend.connections.subscribe(conn => {
          conn.mockRespond(
            new Response(new ResponseOptions(
              { body: { data: JSON.stringify(mockDatasetResponse[0]) } }
            )));
        });

        const result: Promise<Dataset> = service.getDataset('ssc');

        result.then(res => {
          expect(res.id).toEqual('ssc');
          expect(res.hasDenovo).toEqual(true);
          expect(res.hasTransmitted).toEqual(true);
          expect(res.hasCnv).toEqual(true);
        });
      })));

    it('should handle bad response', async(inject(
      [DatasetService, MockBackend], (service, mockBackend) => {

        mockBackend.connections.subscribe(conn => {
          conn.mockRespond(
            new Response(new ResponseOptions(
              { body: '"ala bala"' }
            )));
        });

        const result: Promise<Dataset> = service.getDataset('ssc');
        result.then(res => {
          expect(res).toEqual(undefined);
        });
      })));

    it('should handle bad response 1', async(inject(
      [DatasetService, MockBackend], (service, mockBackend) => {

        mockBackend.connections.subscribe(conn => {
          conn.mockRespond(
            new Response(new ResponseOptions(
              { body: '{"data": "ala bala"}' }
            )));
        });

        const result: Promise<Dataset> = service.getDataset('ssc');
        result.then(res => {
          expect(res).toEqual(undefined);
        });
      })));

  });

  describe('getPhenotypes', () => {
    it('should parse correct dataset response', async(inject(
      [DatasetService, MockBackend], (service, mockBackend) => {

        mockBackend.connections.subscribe(conn => {
          conn.mockRespond(
            new Response(new ResponseOptions(
              { body: { data: JSON.stringify(mockPhenotypeResponse) } }
            )));
        });

        const result: Promise<Phenotype[]> = service.getPhenotypes('ssc');

        result.then(res => {
          expect(res.length).toEqual(2);
          let pheno = res[0];

          expect(pheno.id).toEqual('autism');
          expect(pheno.description).toEqual('autism');

          pheno = res[1];
          expect(pheno.id).toEqual('unaffected');
          expect(pheno.description).toEqual('unaffected');

        });
      })));

    it('should handle bad response', async(inject(
      [DatasetService, MockBackend], (service, mockBackend) => {

        mockBackend.connections.subscribe(conn => {
          conn.mockRespond(
            new Response(new ResponseOptions(
              { body: '"ala bala"' }
            )));
        });

        const result: Promise<Phenotype[]> = service.getPhenotypes('ssc');
        result.then(res => {
          expect(res.length).toEqual(0);
        });
      })));

    it('should handle bad response 1', async(inject(
      [DatasetService, MockBackend], (service, mockBackend) => {

        mockBackend.connections.subscribe(conn => {
          conn.mockRespond(
            new Response(new ResponseOptions(
              { body: '{"data": "ala bala"}' }
            )));
        });

        const result: Promise<Phenotype[]> = service.getPhenotypes('ssc');
        result.then(res => {
          expect(res.length).toEqual(0);
        });
      })));

  });

});
