import { Component, OnInit } from '@angular/core';
import { UsersService } from './users.service';
import { Store } from '@ngrx/store';
import { USER_LOGIN, USER_LOGOUT } from './users-store'

@Component({
  selector: 'gpf-users',
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
  private username;
  private password;
  private displayedUsername: string;
  private loginError = false;

  constructor(
    private store: Store<any>,
    private usersService: UsersService
  ) { }

  ngOnInit() {
    this.reloadUserData();
  }

  reloadUserData() {
    this.usersService.getUserInfo().subscribe(
      (userData) => {
        this.displayedUsername = userData.email;
        this.store.dispatch({
          'type': userData.loggedIn ? USER_LOGIN : USER_LOGOUT,
        });
    });
  }

  login() {
    this.usersService.login(this.username, this.password).subscribe(
      (res) => {
        if (res) {
          this.reloadUserData();
          this.username = null;
          this.password = null;
          this.loginError = false;
        }
        else {
          this.loginError = true;
        }

    });
  }

  logout() {
    this.usersService.logout().subscribe(
      (res) => {
        this.reloadUserData();
    });
  }

}
