import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MarkdownComponent, MarkdownService} from 'ngx-markdown';
import { PopupComponent } from './popup.component';

class MarkdownServiceMock {
  public compile = (): void => null;
  public getSource = (): void => null;
  public highlight = (): void => null;
  public renderKatex = (): void => null;
}

describe('PopupComponent', () => {
  let component: PopupComponent;
  let fixture: ComponentFixture<PopupComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PopupComponent, MarkdownComponent],
      providers: [NgbActiveModal, {provide: MarkdownService, useClass: MarkdownServiceMock}],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
