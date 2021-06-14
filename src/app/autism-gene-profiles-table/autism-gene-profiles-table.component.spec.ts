import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ConfigService } from 'app/config/config.service';
import { MultipleSelectMenuComponent } from 'app/multiple-select-menu/multiple-select-menu.component';
import { SortingButtonsComponent } from 'app/sorting-buttons/sorting-buttons.component';
import { cloneDeep } from 'lodash';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
// tslint:disable-next-line:import-blacklist
import { Observable, of } from 'rxjs';
import { AgpConfig } from './autism-gene-profile-table';

import { AutismGeneProfilesTableComponent } from './autism-gene-profiles-table.component';

const mockConfig = {
  defaultDataset: 'fakeDefaultDataset',
  geneSets: [{category: 'fakeGeneSets', sets: ['fakeGeneSet']}] as any,
  genomicScores: [{category: 'fakeGenomicScores', scores: ['fakeGenomicScore']}] as any,
  datasets: [{name: 'fakeDataset', statistics: ['fakeEffect'], personSets: ['fakePersonSets']}] as any
} as AgpConfig;

describe('AutismGeneProfilesTableComponent', () => {
  let component: AutismGeneProfilesTableComponent;
  let fixture: ComponentFixture<AutismGeneProfilesTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AutismGeneProfilesTableComponent, MultipleSelectMenuComponent, SortingButtonsComponent],
      providers: [ConfigService],
      imports: [Ng2SearchPipeModule, HttpClientTestingModule, FormsModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutismGeneProfilesTableComponent);
    component = fixture.componentInstance;
    component.config = mockConfig;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update genes on window scroll', () => {
    const scrollTopSpy = spyOnProperty(document.documentElement, 'scrollTop');
    const offsetHeightSpy = spyOnProperty(document.documentElement, 'offsetHeight');
    const scrollHeightSpy = spyOnProperty(document.documentElement, 'scrollHeight');
    const updateGenesSpy = spyOn(component, 'updateGenes');
    const calculateModalBottomSpy = spyOn(component, 'calculateModalBottom').and.returnValue(1);

    component['loadMoreGenes'] = false;
    component.onWindowScroll();
    expect(updateGenesSpy).not.toHaveBeenCalled();

    component['loadMoreGenes'] = true;
    scrollTopSpy.and.returnValue(1000 - component['scrollLoadThreshold']);
    offsetHeightSpy.and.returnValue(199);
    scrollHeightSpy.and.returnValue(1200);
    component.onWindowScroll();
    expect(updateGenesSpy).not.toHaveBeenCalled();

    offsetHeightSpy.and.returnValue(200);
    component.onWindowScroll();
    expect(updateGenesSpy).toHaveBeenCalledTimes(1);

    expect(calculateModalBottomSpy).toHaveBeenCalledTimes(3);
    expect(component.modalBottom).toBe(1);
  });

  it('should update shown categories on config change', () => {
    component.shownGeneSetsCategories = undefined;
    component.shownGenomicScoresCategories = undefined;

    component.config = cloneDeep(mockConfig);

    component.ngOnChanges();
    expect(component.shownGeneSetsCategories).toEqual([
      {category: 'fakeGeneSets', sets: ['fakeGeneSet']}
    ] as any);
    expect(component.shownGenomicScoresCategories).toEqual([
      {category: 'fakeGenomicScores', scores: ['fakeGenomicScore']}
    ] as any);
  });

  it('should get genes on initialization', () => {
    component['shownGeneSetsCategories'] = undefined;
    component['shownGenomicScoresCategories'] = undefined;
    component['genes'] = ['mockGene1', 'mockGene2', 'mockGene3'] as any;
    spyOn(component['autismGeneProfilesService'], 'getGenes')
      .and.returnValue(of(['mockGene4', 'mockGene5', 'mockGene6'] as any));

    component.ngOnInit();

    expect(component['shownGeneSetsCategories']).toEqual([{category: 'fakeGeneSets', sets: ['fakeGeneSet']} as any]);
    expect(component['shownGenomicScoresCategories']).toEqual([{category: 'fakeGenomicScores', scores: ['fakeGenomicScore']} as any]);
    expect((component['genes'])).toEqual([
      'mockGene1', 'mockGene2', 'mockGene3', 'mockGene4', 'mockGene5', 'mockGene6'
    ] as any);
  });

  it('should calculate modal bottom', () => {
    component.columnFilteringButtons = {
      first: undefined
    } as any;
    expect(component.calculateModalBottom()).toBe(0);

    component.columnFilteringButtons = {
      first: {
        nativeElement: {
          getBoundingClientRect() { return {bottom: 10}; }
        }
      }
    } as any;
    spyOnProperty(window, 'innerHeight').and.returnValue(11);
    expect(component.calculateModalBottom()).toBe(1);
  });

  it('should handle multiple select apply event', () => {
    const dropDownMenuSpies = [];
    component.ngbDropdownMenu = [
      {dropdown: {close() {}}},
      {dropdown: {close() {}}},
      {dropdown: {close() {}}}
    ] as any;
    component.ngbDropdownMenu.forEach(menu => dropDownMenuSpies.push(spyOn(menu.dropdown, 'close')));
    const emitSpy = spyOn(component.configChange, 'emit');

    component.config = cloneDeep(mockConfig);

    const geneSetsArray = [
      {category: 'fakeGeneSets1', sets: [{setId: 'fakeGeneSet11'}, {setId: 'fakeGeneSet12'}]},
      {category: 'fakeGeneSets2', sets: [{setId: 'fakeGeneSet21'}, {setId: 'fakeGeneSet22'}]}];
    const genomicScoresArray = [
      {category: 'fakeGenomicScores1', scores: [{scoreName: 'fakeGenomicScore11'}, {scoreName: 'fakeGenomicScore12'}]},
      {category: 'fakeGenomicScores2', scores: [{scoreName: 'fakeGenomicScore21'}, {scoreName: 'fakeGenomicScore22'}]}];

    component.config = {
      defaultDataset: 'fakeDefaultDataset',
      geneSets: geneSetsArray as any,
      genomicScores: genomicScoresArray as any,
      datasets: [{name: 'fakeDataset', statistics: ['fakeEffect'], personSets: ['fakePersonSets']}] as any
    } as AgpConfig;

    component['shownGeneSetsCategories'] = geneSetsArray as any;

    component['shownGenomicScoresCategories'] = genomicScoresArray as any;

    component.handleMultipleSelectMenuApplyEvent({
      menuId: 'gene_set_category:fakeGeneSets1',
      data: ['fakeGeneSet12']
    });
    expect(component['shownGeneSetsCategories']).toEqual([
      {category: 'fakeGeneSets1', sets: [{setId: 'fakeGeneSet12'}]} as any,
      {category: 'fakeGeneSets2', sets: [{setId: 'fakeGeneSet21'}, {setId: 'fakeGeneSet22'}]}
    ]);
    expect(component['shownGenomicScoresCategories']).toEqual([
      {category: 'fakeGenomicScores1', scores: [{scoreName: 'fakeGenomicScore11'}, {scoreName: 'fakeGenomicScore12'}]} as any,
      {category: 'fakeGenomicScores2', scores: [{scoreName: 'fakeGenomicScore21'}, {scoreName: 'fakeGenomicScore22'}]} as any
    ]);
    dropDownMenuSpies.forEach(spy => expect(spy).toHaveBeenCalledTimes(1));
    expect(emitSpy).not.toHaveBeenCalled();

    component.handleMultipleSelectMenuApplyEvent({
      menuId: 'genomic_scores_category:fakeGenomicScores1',
      data: ['fakeGenomicScore12']
    });
    expect(component['shownGeneSetsCategories']).toEqual([
      {category: 'fakeGeneSets1', sets: [{setId: 'fakeGeneSet12'}]},
      {category: 'fakeGeneSets2', sets: [{setId: 'fakeGeneSet21'}, {setId: 'fakeGeneSet22'}]} as any
    ]);
    expect(component['shownGenomicScoresCategories']).toEqual([
      {category: 'fakeGenomicScores1', scores: [{scoreName: 'fakeGenomicScore12'}]} as any,
      {category: 'fakeGenomicScores2', scores: [{scoreName: 'fakeGenomicScore21'}, {scoreName: 'fakeGenomicScore22'}]} as any
    ]);
    dropDownMenuSpies.forEach(spy => expect(spy).toHaveBeenCalledTimes(2));
    expect(emitSpy).not.toHaveBeenCalled();

    component.handleMultipleSelectMenuApplyEvent({
      menuId: 'gene_set_category:fakeGeneSets1',
      data: []
    });
    expect(component['shownGeneSetsCategories']).toEqual([
      {category: 'fakeGeneSets2', sets: [{setId: 'fakeGeneSet21'}, {setId: 'fakeGeneSet22'}]}  as any
    ]);
    expect(component['shownGenomicScoresCategories']).toEqual([
      {category: 'fakeGenomicScores1', scores: [{scoreName: 'fakeGenomicScore12'}]} as any,
      {category: 'fakeGenomicScores2', scores: [{scoreName: 'fakeGenomicScore21'}, {scoreName: 'fakeGenomicScore22'}]} as any
    ]);
    dropDownMenuSpies.forEach(spy => expect(spy).toHaveBeenCalledTimes(3));
    expect(emitSpy).toHaveBeenCalledTimes(1);

    component.handleMultipleSelectMenuApplyEvent({
      menuId: 'genomic_scores_category:fakeGenomicScores1',
      data: []
    });
    expect(component['shownGeneSetsCategories']).toEqual([
      {category: 'fakeGeneSets2', sets: [{setId: 'fakeGeneSet21'}, {setId: 'fakeGeneSet22'}]}  as any
    ]);
    expect(component['shownGenomicScoresCategories']).toEqual([
      {category: 'fakeGenomicScores2', scores: [{scoreName: 'fakeGenomicScore21'}, {scoreName: 'fakeGenomicScore22'}]} as any
    ]);
    dropDownMenuSpies.forEach(spy => expect(spy).toHaveBeenCalledTimes(4));
    expect(emitSpy).toHaveBeenCalledTimes(2);

    expect(emitSpy.calls.allArgs()[0][0].geneSets).toEqual([
      {
          category: 'fakeGeneSets2',
          sets: [
              { setId: 'fakeGeneSet21' },
              { setId: 'fakeGeneSet22' }
          ]
      } as any
    ]);
    expect(emitSpy.calls.allArgs()[1][0].genomicScores).toEqual([
      {
          category: 'fakeGenomicScores2',
          scores: [
              { scoreName: 'fakeGenomicScore21' },
              { scoreName: 'fakeGenomicScore22' }
          ]
      } as any
    ]);
  });

  it('should emit create tab event', () => {
    const expectedEmitValue = {geneSymbol: 'testGeneSymbol', openTab: true};

    const emitSpy = spyOn(component.createTabEvent, 'emit').and.callFake(emitValue => {
      expect(emitValue).toEqual(expectedEmitValue);
    });

    component.emitCreateTabEvent('testGeneSymbol', true);
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should update genes', () => {
    component['loadMoreGenes'] = true;
    component['genes'] = ['mockGene1', 'mockGene2', 'mockGene3'] as any;
    const getGenesSpy = spyOn(component['autismGeneProfilesService'], 'getGenes');

    getGenesSpy.and.returnValue(of(['mockGene4', 'mockGene5', 'mockGene6'] as any));
    component.updateGenes();
    expect(getGenesSpy).toHaveBeenCalledTimes(1);
    expect((component['genes'])).toEqual([
      'mockGene1', 'mockGene2', 'mockGene3', 'mockGene4', 'mockGene5', 'mockGene6'
    ] as any);
    expect(component['loadMoreGenes']).toBe(true);


    getGenesSpy.and.returnValue(of([] as any));
    component.updateGenes();
    expect(getGenesSpy).toHaveBeenCalledTimes(2);
    expect((component['genes'])).toEqual([
      'mockGene1', 'mockGene2', 'mockGene3', 'mockGene4', 'mockGene5', 'mockGene6'
    ] as any);
    expect(component['loadMoreGenes']).toBe(false);
  });

  it('should search for genes', () => {
    const updateGenesSpy = spyOn(component, 'updateGenes');
    expect(component.geneInput).toEqual(undefined);
    component.search('mockSearchString');
    expect(component.geneInput).toEqual('mockSearchString');
    expect(updateGenesSpy).toHaveBeenCalledTimes(1);
  });

  it('should sort with given parameters', () => {
    const updateGenesSpy = spyOn(component, 'updateGenes');

    component.sort('mockSortBy');
    expect(component.sortBy).toEqual('mockSortBy');
    expect(component.orderBy).toEqual(undefined);
    expect(updateGenesSpy).toHaveBeenCalledTimes(1);

    component.sort('mockSortBy', 'mockOrderBy');
    expect(component.sortBy).toEqual('mockSortBy');
    expect(component.orderBy).toEqual('mockOrderBy');
    expect(updateGenesSpy).toHaveBeenCalledTimes(2);
  });

  it('should send keystrokes', () => {
    const searchKeystrokesNextSpy = spyOn(component.searchKeystrokes$, 'next');
    component.sendKeystrokes('mockValue');
    expect(searchKeystrokesNextSpy).toHaveBeenCalledWith('mockValue');
  });
});
