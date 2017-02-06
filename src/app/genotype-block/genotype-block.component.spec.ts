/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { GenotypeBlockComponent } from './genotype-block.component';
import { GenderComponent } from '../gender/gender.component';
import { VarianttypesComponent } from '../varianttypes/varianttypes.component';
import { EffecttypesComponent, EffecttypesColumnComponent } from '../effecttypes/effecttypes.component';
import { PedigreeSelectorComponent } from '../pedigree-selector/pedigree-selector.component';

import { gpfReducer } from '../store/gpf-store';
import { StoreModule } from '@ngrx/store';


describe('GenotypeBlockComponent', () => {
  let component: GenotypeBlockComponent;
  let fixture: ComponentFixture<GenotypeBlockComponent>;

  beforeEach(async(() => {
    const storeSpy = jasmine.createSpyObj('Store', ['dispatch', 'subscribe', 'select', 'let']);
    TestBed.configureTestingModule({
      declarations: [
        GenderComponent,
        VarianttypesComponent,
        EffecttypesComponent,
        EffecttypesColumnComponent,
        GenotypeBlockComponent,
        PedigreeSelectorComponent,
      ],
      imports: [
        NgbModule.forRoot(),
        StoreModule.provideStore(gpfReducer),

      ],
      providers: [
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GenotypeBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
