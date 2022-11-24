import { Component, OnInit, Inject } from '@angular/core';
import { UsersService } from './users.service';
import { ConfigService } from '../config/config.service';
import { Observable } from 'rxjs';
import { share, take } from 'rxjs/operators';
import { AuthService } from 'app/auth.service';
import { APP_BASE_HREF } from '@angular/common';

@Component({
  selector: 'gpf-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  public userInfo$: Observable<any>;

  public constructor(
    private usersService: UsersService,
    private config: ConfigService,
    private authService: AuthService,
    @Inject(APP_BASE_HREF) private baseHref: string
  ) { }

  public ngOnInit(): void {
    this.reloadUserData();
    this.userInfo$ = this.usersService.getUserInfoObservable().pipe(share());
  }

  public reloadUserData(): void {
    this.usersService.getUserInfo().pipe(take(1)).subscribe();
  }

  public login(): void {
    const codeChallenge = this.authService.generatePKCE();
    window.open(
      `${this.config.rootUrl}${this.baseHref}`
        + `o/authorize/?response_type=code&code_challenge_method=S256&code_challenge=${codeChallenge}`
        + '&scope=read'
        + `&client_id=${this.config.oauthClientId}`,
      '_blank',
      `popup=true,width=600,height=300,left=${window.screenX},top=${window.screenY}`
    );
  }

  public logout(): void {
    this.usersService.logout().subscribe(() => this.reloadUserData());
  }
}
