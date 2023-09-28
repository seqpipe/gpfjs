import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatasetsComponent } from './datasets.component';
import { UsersService } from 'app/users/users.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ConfigService } from 'app/config/config.service';
import { NgxsModule } from '@ngxs/store';
import { APP_BASE_HREF } from '@angular/common';
import { DatasetsService } from './datasets.service';
import { of } from 'rxjs/internal/observable/of';
import {
  Column, Dataset, GeneBrowser, GenotypeBrowser,
  PersonFilter, PersonSet, PersonSetCollection, PersonSetCollections
} from './datasets';
import { UserGroup } from 'app/users-groups/users-groups';
import { Observable } from 'rxjs/internal/Observable';
import { DatasetNode } from 'app/dataset-node/dataset-node';
import { RouterTestingModule } from '@angular/router/testing';

class MockDatasetService {
  public getDatasetsObservable(): Observable<Dataset[]> {
    return of([mockDataset1]);
  }
  public getVisibleDatasets(): string[] {
    return ['id1'];
  }

  public getDatasetsLoadedObservable(): Observable<object[]> {
    return of([mockDataset1]);
  }

  public getPermissionDeniedPrompt(): Observable<object[]> {
    return of([{}]);
  }
}

const mockDataset1 = new Dataset(
  'id1',
  'desc1',
  'name1',
  [],
  true,
  ['study1', 'study2'],
  ['studyName1', 'studyName2'],
  ['studyType1', 'studyType2'],
  'phenotypeData1',
  false,
  true,
  true,
  false,
  {enabled: true},
  new GenotypeBrowser(
    false,
    true,
    false,
    false,
    true,
    false,
    true,
    false,
    false,
    [
      new Column('name1', 'source1', 'format1'),
      new Column('name2', 'source2', 'format2')
    ],
    [
      new PersonFilter('personFilter1', 'string1', 'source1', 'sourceType1', 'filterType1', 'role1'),
      new PersonFilter('personFilter2', 'string2', 'source2', 'sourceType2', 'filterType2', 'role2')
    ],
    [
      new PersonFilter('familyFilter3', 'string3', 'source3', 'sourceType3', 'filterType3', 'role3'),
      new PersonFilter('familyFilter4', 'string4', 'source4', 'sourceType4', 'filterType4', 'role4')
    ],
    new Set(['inheritance', 'string1']),
    new Set(['selectedInheritance', 'string2']),
    new Set(['variant', 'string3']),
    new Set(['selectedVariant', 'string1']),
    5
  ),
  new PersonSetCollections(
    [
      new PersonSetCollection(
        'id1',
        'name1',
        [
          new PersonSet('id1', 'name1', 'color1'),
          new PersonSet('id1', 'name2', 'color3'),
          new PersonSet('id2', 'name3', 'color4')
        ]
      ),
      new PersonSetCollection(
        'id2',
        'name2',
        [
          new PersonSet('id2', 'name2', 'color2'),
          new PersonSet('id2', 'name3', 'color5'),
          new PersonSet('id3', 'name4', 'color6')
        ]
      )
    ]
  ),
  [
    new UserGroup(3, 'name1', ['user1', 'user2'], [{datasetName: 'dataset2', datasetId: 'dataset3'}]),
    new UserGroup(5, 'name2', ['user12', 'user5'], [{datasetName: 'dataset1', datasetId: 'dataset2'}])
  ],
  new GeneBrowser(true, 'frequencyCol1', 'frequencyName1', 'effectCol1', 'locationCol1', 5, 6, true),
  false,
  'genome1'
);

describe('DatasetComponent', () => {
  let component: DatasetsComponent;
  let fixture: ComponentFixture<DatasetsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NgxsModule.forRoot([], {developmentMode: true}),
        RouterTestingModule
      ],
      providers: [
        UsersService, ConfigService,
        { provide: DatasetsService, useValue: new MockDatasetService() },
        { provide: APP_BASE_HREF, useValue: '' }
      ],
      declarations: [DatasetsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DatasetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should test dataset visibility', () => {
    component.datasetTrees = new Array<DatasetNode>(new DatasetNode(mockDataset1, []));
    component.visibleDatasets = ['id1'];
    component.ngOnInit();
    expect(component.datasetTrees).toStrictEqual([new DatasetNode(mockDataset1, [mockDataset1])]);
    expect(component.visibleDatasets).toBe('id1');

    Object.defineProperty(mockDataset1, 'id', { value: 'id2' });
    component.ngOnInit();
    expect(component.datasetTrees).toStrictEqual([]);
    expect(component.visibleDatasets).toBe('id1');
  });

  it.todo('check for selectedDataset');
});
