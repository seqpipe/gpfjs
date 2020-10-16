import { HttpClient, HttpHandler } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ConfigService } from 'app/config/config.service';
import { DatasetsService } from 'app/datasets/datasets.service';
import { MeasuresService } from 'app/measures/measures.service';
import { PhenoMeasureSelectorComponent } from 'app/pheno-measure-selector/pheno-measure-selector.component';
import { StateRestoreService } from 'app/store/state-restore.service';
import { UsersService } from 'app/users/users.service';
import { MultiContinuousFilterComponent } from './multi-continuous-filter.component';
import { Component, Input, Output } from '@angular/core';

@Component({
  selector: 'gpf-searchable-select',
})
export class SearchableSelectMockComponent {
  @Input() data;
  @Input() caption;
}

const SelectionMock = {
  isEmpty() { return true; }
};

const ContinuousFilterStateMock = {
  id: '',
  type: '',
  role: '',
  measure: '',
  measureType: '',
  selection: SelectionMock,
  isEmpty() { return true; },
  min: 0,
  max: 0,
  domainMin: 0,
  domainMax: 0
};

const PhenoFilterMock = {
  name: '',
  measureType: '',
  role: '',
  filterType: '',
  measure: '',
  domain: ['']
};

describe('MultiContinuousFilterComponent', () => {
  let component: MultiContinuousFilterComponent;
  let fixture: ComponentFixture<MultiContinuousFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        MultiContinuousFilterComponent,
        PhenoMeasureSelectorComponent,
        SearchableSelectMockComponent,
      ],
      providers: [
        MultiContinuousFilterComponent,
        StateRestoreService,
        MeasuresService,
        HttpClient,
        HttpHandler,
        ConfigService,
        DatasetsService,
        UsersService,
      ],
      imports: [
        RouterTestingModule,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MultiContinuousFilterComponent);
    component = fixture.componentInstance;
    component.continuousFilter = PhenoFilterMock;
    component.datasetId = '';
    component.continuousFilterState = ContinuousFilterStateMock;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
