import {
  Component, OnInit, HostListener, ViewChild, ElementRef, ChangeDetectorRef, EventEmitter, Output
} from '@angular/core';
import { UsersService } from './users.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { RegistrationComponent } from '../registration/registration.component';
import { ForgotPasswordComponent } from '../forgot-password/forgot-password.component';
import { share, take } from 'rxjs/operators';

@Component({
  selector: 'gpf-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  public username: string;
  public password: string;
  public passwordTimeout = false;
  public loading = false;
  public errorMessage: string;
  public hideDropdown = true;
  public userInfo$: Observable<any>;
  public showPasswordField = false;

  @ViewChild('dropdownButton') public dropdownButton: ElementRef;
  @ViewChild('dialog') public dialog: ElementRef;
  @ViewChild('emailInput') public emailInput: ElementRef;
  @ViewChild('passwordInput') public passwordInput: ElementRef;

  @Output() public loginDropdownClickEvent = new EventEmitter();

  public constructor(
    private modalService: NgbModal,
    private usersService: UsersService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    this.reloadUserData();
    this.userInfo$ = this.usersService.getUserInfoObservable().pipe(share());
    this.usersService.emailLog.subscribe(email => {
      this.username = email;
    });
  }

  public reloadUserData(): void {
    this.usersService.getUserInfo().pipe(take(1)).subscribe(() => {
      this.loading = false;
    });
  }

  public back(): void {
    this.showPasswordField = false;
  }

  public next(): void {
    this.usersService.login(this.username).subscribe(
      (res) => {
        if (res === true) {
          this.showPasswordField = true;
          this.errorMessage = undefined;
        } else {
          this.showPasswordField = false;
          if (res['status'] === 404 || res['status'] === 400) {
            this.errorMessage = 'Invalid email!';
          } else if (res['status'] === 403) {
            this.errorMessage = `Too many incorrect attempts! Please wait ${res['error']['lockout_time']} seconds!`;
          }
        }
      });
  }

  public login(): void {
    this.loading = true;
    this.usersService.login(this.username, this.password).subscribe(
      (res) => {
        if (res === true) {
          this.reloadUserData();
          this.username = null;
          this.password = null;
          this.showPasswordField = false;
          this.errorMessage = undefined;
        } else {
          this.loading = false;
          if (res['status'] === 401) {
            this.passwordTimeout = true;
            setTimeout(() => {
              this.passwordTimeout = false;
              this.showPasswordField = true;
              this.errorMessage = 'Wrong password!';
            }, 1000);
          } else if (res['status'] === 403) {
            this.showPasswordField = false;
            this.errorMessage = `Too many incorrect attempts! Please wait ${res['error']['lockout_time']} seconds!`;
          }
        }
      });
  }

  public logout(): void {
    this.usersService.logout().subscribe(() => this.reloadUserData());
  }

  public showRegister(): void {
    this.usersService.emailLog.next(this.username);
    this.modalService.open(RegistrationComponent);
  }

  public showForgotPassword(): void {
    this.usersService.emailLog.next(this.username);
    this.modalService.open(ForgotPasswordComponent);
  }

  @HostListener('document:click', ['$event'])
  public onClick(event): void {
    if (
      !event.composedPath().find(
        element => element.id === 'login-window' || element.id === 'login-dropdown-toggle-button'
      )
    ) {
      this.hideDropdown = true;
    }
  }

  public loginDropdownClick(): void {
    this.hideDropdown = !this.hideDropdown;
    this.focusEmailInput();
    this.loginDropdownClickEvent.emit();
  }

  public focusEmailInput(): void {
    this.changeDetectorRef.detectChanges();
    this.emailInput.nativeElement.focus();
  }

  public focusPasswordInput(): void {
    this.waitForPasswordInput().then(() => {
      this.passwordInput.nativeElement.focus();
    });
  }

  private async waitForPasswordInput(): Promise<void> {
    return new Promise<void>(resolve => {
      const timer = setInterval(() => {
        if (this.passwordInput !== undefined) {
          resolve();
          clearInterval(timer);
        }
      }, 100);
    });
  }
}
