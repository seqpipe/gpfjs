import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '../users/users.service';

@Component({
  selector: 'gpf-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements AfterViewInit {
  @ViewChild('content') content;
  password: string;
  confirmPassword: string;
  verifPath: string;

  resetPasswordError = '';
  verifPathValid = false;

  private modalView;

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private usersService: UsersService,
    private route: ActivatedRoute
  ) { }

  ngAfterViewInit() {
    this.verifPath = this.route.snapshot.params['validateString'];
    this.modalView = this.modalService.open(this.content);

    this.usersService.checkVerification(this.verifPath).subscribe(
      (res) => {
        if (res) {
          this.verifPathValid = true;
        } else {
          this.verifPathValid = false;
          this.resetPasswordError = 'Invalid verification URL';
        }
    });

    this.modalView.result.then(
      (result) => {
        this.router.navigate([{ outlets: { popup: null }}]);
      }, (reason) => {
        this.router.navigate([{ outlets: { popup: null }}]);
      }
    );
  }

  resetPassword() {
    if (this.password !== this.confirmPassword) {
      this.resetPasswordError = 'Passwords don\'t match';
      return;
    }

    this.usersService.changePassword(this.password, this.verifPath).subscribe(
      (res) => {
        if (res) {
          this.password = null;
          this.confirmPassword = null;
          this.resetPasswordError = '';

          this.modalView.close();
        } else {
          this.resetPasswordError = 'Reset Password Failed';
        }

    });
  }

}
