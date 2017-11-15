import { Component, OnInit, Input, forwardRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { MeasuresService } from '../measures/measures.service';
import { ContinuousMeasure } from '../measures/measures';
import { DatasetsService } from '../datasets/datasets.service';

@Component({
  selector: 'gpf-pheno-measure-selector',
  templateUrl: './pheno-measure-selector.component.html',
  styleUrls: ['./pheno-measure-selector.component.css']
})
export class PhenoMeasureSelectorComponent implements OnInit {
  @ViewChild('inputGroup') inputGroupSpan: any;
  @ViewChild('searchBox') searchBox: any;

  measures: Array<ContinuousMeasure>;
  filteredMeasures: Array<ContinuousMeasure>;
  internalSelectedMeasure: ContinuousMeasure;
  searchString: string;

  @Output() selectedMeasureChange = new EventEmitter();
  @Output() measuresChange = new EventEmitter();

  constructor(
    private measuresService: MeasuresService,
    private datasetsService: DatasetsService
  ) { }

  ngOnInit() {
    this.datasetsService.getSelectedDataset().subscribe(dataset => {
      if (!dataset) {
        return;
      }
      this.measuresService.getContinuousMeasures(dataset.id)
        .subscribe(measures => {
          this.measures = measures;
          this.searchBoxChange('');
          this.measuresChange.emit(this.measures);
        });
    });
  }

  @Input()
  set selectedMeasure(measure) {
    this.internalSelectedMeasure = measure;
    this.selectedMeasureChange.emit(measure);
  }

  get selectedMeasure(): ContinuousMeasure {
    return this.internalSelectedMeasure;
  }

  clear() {
    this.selectedMeasure = null;
    this.searchBox.nativeElement.value = '';
    this.searchBoxChange('');
  }

  onFocus(event) {
    event.stopPropagation();
    this.inputGroupSpan.nativeElement.classList.add('show');
    this.selectedMeasure = null;
  }

  searchBoxChange(searchFieldValue) {
    this.searchString = searchFieldValue;

    this.filteredMeasures = this.measures.filter(
      (value) => {
        return value.name.indexOf(searchFieldValue) !== -1;
      });
  }

}
