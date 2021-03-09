import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AutismGeneToolConfig } from 'app/autism-gene-profiles/autism-gene-profile';
import { ConfigService } from 'app/config/config.service';
import { GeneWeightsService } from 'app/gene-weights/gene-weights.service';
import { of } from 'rxjs';

import { AutismGeneSingleProfileComponent } from './autism-gene-single-profile.component';

describe('AutismGeneSingleProfileComponent', () => {
  let component: AutismGeneSingleProfileComponent;
  let fixture: ComponentFixture<AutismGeneSingleProfileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AutismGeneSingleProfileComponent ],
      providers: [ConfigService, GeneWeightsService],
      imports: [HttpClientTestingModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutismGeneSingleProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set gene sets if config is passed', () => {
    expect(component.config).toEqual(undefined);
    expect(component['geneSets']).toEqual(undefined);

    component.ngOnChanges();
    expect(component['geneSets']).toEqual(undefined);

    component.config = {geneSets: ['fakeGeneSet1', 'fakeGeneSet2']} as any;

    component.ngOnChanges();
    expect(component['geneSets']).toEqual(['fakeGeneSet1', 'fakeGeneSet2']);
  });

  it('should initialize', () => {
    (component as any).geneSymbol = 'mockGeneSymbol';
    const getGeneSpy = spyOn(component['autismGeneProfilesService'], 'getGene');
    const mockAutismScores = new Map();
    mockAutismScores.set('fakeAutismScore', 1);
    const mockProtectionScores = new Map();
    mockProtectionScores.set('fakeProtectionScore', 2);

    const geneMock = of({
      autismScores: mockAutismScores,
      protectionScores: mockProtectionScores
    } as any);
    getGeneSpy.and.returnValue(geneMock);

    const getGeneWeightsSpy = spyOn(component['geneWeightsService'], 'getGeneWeights');
    getGeneWeightsSpy.and.returnValue(of('fakeWeight' as any));

    component.ngOnInit();
    expect(component['gene$']).toEqual(geneMock);
    expect(getGeneSpy).toHaveBeenCalledWith('mockGeneSymbol');
    expect(getGeneWeightsSpy.calls.allArgs()).toEqual([
      ['fakeAutismScore'],
      ['fakeProtectionScore']
    ]);
    expect(component['autismScoreGeneWeights']).toEqual('fakeWeight' as any);
    expect(component['protectionScoreGeneWeights']).toEqual('fakeWeight' as any);
  });

  it('should format score name', () => {
    expect(component.formatScoreName('fake_score_name')).toEqual('fake score name');
  });

  it('should get autism score gene weight', () => {
    component['autismScoreGeneWeights'] = [
      {weight: 'weight1'},
      {weight: 'weight2'},
      {weight: 'weight3'},
      {weight: 'weight4'},
    ] as any;
    expect(component.getAutismScoreGeneWeight('weight1')).toEqual({weight: 'weight1'} as any);
    expect(component.getAutismScoreGeneWeight('weight2')).toEqual({weight: 'weight2'} as any);
    expect(component.getAutismScoreGeneWeight('weight3')).toEqual({weight: 'weight3'} as any);
    expect(component.getAutismScoreGeneWeight('weight4')).toEqual({weight: 'weight4'} as any);
  });

  it('should get protection score gene weight', () => {
    component['protectionScoreGeneWeights'] = [
      {weight: 'weight1'},
      {weight: 'weight2'},
      {weight: 'weight3'},
      {weight: 'weight4'},
    ] as any;
    expect(component.getProtectionScoreGeneWeight('weight1')).toEqual({weight: 'weight1'} as any);
    expect(component.getProtectionScoreGeneWeight('weight2')).toEqual({weight: 'weight2'} as any);
    expect(component.getProtectionScoreGeneWeight('weight3')).toEqual({weight: 'weight3'} as any);
    expect(component.getProtectionScoreGeneWeight('weight4')).toEqual({weight: 'weight4'} as any);
  });

  it('should get histogram options', () => {
    component['_histogramOptions'] = {option: 'fakeOption'} as any;
    expect(component.histogramOptions).toEqual({option: 'fakeOption'} as any);
  });

  it('should get browser url', () => {
    component.config = undefined;
    expect(component.geneBrowserUrl).toEqual(undefined);

    component.config = {defaultDataset: 'fakeDataset'} as any;
    (component as any).geneSymbol = 'fakeGeneSymbol';
    expect(component.geneBrowserUrl).toEqual(
      '/datasets/fakeDataset/geneBrowser/fakeGeneSymbol'
    );
  });
});
