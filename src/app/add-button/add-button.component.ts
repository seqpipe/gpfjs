import { Component, Output, EventEmitter } from '@angular/core';
import { environment } from '../../environments/environment';

@Component({
  selector: 'gpf-add-button',
  templateUrl: './add-button.component.html',
  styleUrls: ['./add-button.component.css']
})
export class AddButtonComponent {
  @Output() public addFilter: EventEmitter<any> = new EventEmitter(true);
  public imgPathPrefix = environment.imgPathPrefix;

  public add(): void {
    this.addFilter.emit(null);
  }
}
