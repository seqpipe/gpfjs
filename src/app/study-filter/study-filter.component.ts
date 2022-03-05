import { Component, Input, Output, EventEmitter } from '@angular/core';

import { IsNotEmpty } from 'class-validator';
import { environment } from 'environments/environment';

export class Study {
  @IsNotEmpty() studyId: string;
  @IsNotEmpty() studyName: string;
  constructor(studyId: string, studyName: string) {
    this.studyId = studyId;
    this.studyName = studyName;
  };
}

@Component({
  selector: 'gpf-study-filter',
  templateUrl: './study-filter.component.html',
  styleUrls: ['./study-filter.component.css']
})
export class StudyFilterComponent {
  @Input() studies: Study[];
  @Input() selectedStudy: Study;
  @Input() errors: string[];
  @Output() changeSelectedStudyEvent = new EventEmitter<object>();

  public imgPathPrefix = environment.imgPathPrefix;

  set selectedStudyNames(selectedStudyId: string) {
    this.changeSelectedStudyEvent.emit({
      selectedStudy: this.selectedStudy,
      selectedStudyId: selectedStudyId
    });
  }

  get selectedStudyNames() {
    return this.selectedStudy.studyId;
  }
}
