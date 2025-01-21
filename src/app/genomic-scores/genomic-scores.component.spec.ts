import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MarkdownModule } from 'ngx-markdown';
import { GenomicScoresComponent } from './genomic-scores.component';
import { PopupComponent } from 'app/popup/popup.component';
import { ErrorsAlertComponent } from 'app/errors-alert/errors-alert.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Store, StoreModule } from '@ngrx/store';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { GenomicScoreState, setGenomicScoresCategorical } from 'app/genomic-scores-block/genomic-scores-block.state';
import { CategoricalHistogram, GenomicScore } from 'app/genomic-scores-block/genomic-scores-block';

describe('GenomicScoresComponent', () => {
  let component: GenomicScoresComponent;
  let fixture: ComponentFixture<GenomicScoresComponent>;
  let store: Store;

  beforeEach(async() => {
    await TestBed.configureTestingModule({
      declarations: [
        GenomicScoresComponent,
        PopupComponent,
        ErrorsAlertComponent,
      ],
      imports: [
        NgbModule,
        FormsModule,
        MarkdownModule.forRoot(),
        StoreModule.forRoot({}),
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .overrideModule(BrowserDynamicTestingModule, {
        set: {}
      })
      .compileComponents();

    fixture = TestBed.createComponent(GenomicScoresComponent);
    component = fixture.componentInstance;

    component.errors = [];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    store = TestBed.inject(Store);

    component.selectedGenomicScore = new GenomicScore(
      'desc',
      'help',
      'score',
      new CategoricalHistogram(
        [
          {name: 'name1', value: 10},
          {name: 'name2', value: 20},
          {name: 'name3', value: 30},
          {name: 'name4', value: 40},
          {name: 'name5', value: 50},
        ],
        ['name1', 'name2', 'name3', 'name4', 'name5'],
        'large value descriptions',
        'small value descriptions',
        true,
      ),
    );

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle categorical values', () => {
    component.localState = {
      score: 'score',
      histogramType: 'categorical',
      rangeStart: null,
      rangeEnd: null,
      values: ['value1', 'value2', 'value3'],
      categoricalView: 'range selector',
    } as GenomicScoreState;

    const dispatchSpy = jest.spyOn(store, 'dispatch').mockImplementation();

    expect(component.localState.values).toStrictEqual(['value1', 'value2', 'value3']);
    component.toggleCategoricalValues(['value2', 'value3', 'value4']);
    expect(component.localState.values).toStrictEqual(['value1', 'value4',]);
    expect(dispatchSpy).toHaveBeenCalledWith(setGenomicScoresCategorical({
      score: component.localState.score,
      values: component.localState.values,
      categoricalView: component.localState.categoricalView,
    }));
  });
});
