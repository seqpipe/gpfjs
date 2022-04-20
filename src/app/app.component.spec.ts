import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { GenderComponent } from './gender/gender.component';
import { VariantTypesComponent } from './variant-types/variant-types.component';
import { DatasetsService } from './datasets/datasets.service';
import { DatasetsComponent } from './datasets/datasets.component';
import { EffectTypesComponent } from './effect-types/effect-types.component';
import { GenotypeBlockComponent } from './genotype-block/genotype-block.component';
import { RegionsBlockComponent } from './regions-block/regions-block.component';
import { GenesBlockComponent } from './genes-block/genes-block.component';
import { PedigreeSelectorComponent } from './pedigree-selector/pedigree-selector.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { EffecttypesColumnComponent } from './effect-types/effect-types-column.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ConfigService } from './config/config.service';
import { UsersService } from './users/users.service';
import { RouterTestingModule } from '@angular/router/testing';
import { NgxsModule } from '@ngxs/store';
import { FullscreenLoadingComponent } from './fullscreen-loading/fullscreen-loading.component';
import { UsersComponent } from './users/users.component';
import { FullscreenLoadingService } from './fullscreen-loading/fullscreen-loading.service';
import { FormsModule } from '@angular/forms';

class MockDatasetsService {
  public getSelectedDataset(): object {
    return { id: 'testDataset' };
  }
}

describe('AppComponent', () => {
  const datasetsServiceMock = new MockDatasetsService();

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        DatasetsComponent,
        GenderComponent,
        VariantTypesComponent,
        EffectTypesComponent,
        EffecttypesColumnComponent,
        GenotypeBlockComponent,
        RegionsBlockComponent,
        GenesBlockComponent,
        PedigreeSelectorComponent,
        FullscreenLoadingComponent,
        UsersComponent
      ],
      imports: [
        NgbModule,
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
        NgxsModule.forRoot([], {developmentMode: true})
      ],
      providers: [
        { provide: DatasetsService, useValue: datasetsServiceMock },
        ConfigService,
        UsersService,
        FullscreenLoadingService
      ]
    });
    TestBed.compileComponents();
  });

  it('should create the app', () => {
    let fixture = TestBed.createComponent(AppComponent);
    let app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have as title "GPF: Genotypes and Phenotypes in Families"', () => {
    let fixture = TestBed.createComponent(AppComponent);
    let app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual(app.title);
  });

  it('should render title in a h3 tag', () => {
    let fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    let compiled = fixture.debugElement.nativeElement;
    let app = fixture.debugElement.componentInstance;
    expect(compiled.querySelector('h3').textContent).toContain(app.title);
  });
});
