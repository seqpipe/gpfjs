import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

// tslint:disable-next-line:import-blacklist
import { BehaviorSubject } from 'rxjs';

import { User } from '../users/users';
import { UsersService } from '../users/users.service';
import { UserGroup } from '../users-groups/users-groups';
import { UsersGroupsService } from '../users-groups/users-groups.service';

@Component({
  selector: 'gpf-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.css']
})
export class UserEditComponent implements OnInit {
  lockedOptions = {
    width: 'style',
    theme: 'bootstrap',
    multiple: true,
    tags: true,
    disabled: true,
  };

  user$ = new BehaviorSubject<User>(null);
  groups$ = new BehaviorSubject<UserGroup[]>(null);
  emailValue: string;

  edit = true;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private usersService: UsersService,
    private usersGroupsService: UsersGroupsService
  ) { }

  ngOnInit() {
    this.route.params.take(1)
      .map(params => +params['id'])
      .switchMap(userId => this.usersService.getUser(userId))
      .subscribe(user => {
        this.emailValue = user.email;
        this.user$.next(user);
      });

      const allGroups = this.usersGroupsService
      .getAllGroups()
      .subscribe(groups => this.groups$.next(groups));
  }

  getDefaultGroupsSelect2() {
    return this.getDefaultGroups().map(group => ({
        id: group,
        text: group,
        selected: true,
      }));
  }

  updateGroups(groups) {
    this.user$.value.groups = groups;
  }

  getDefaultGroups() {
    return ['any_user', this.emailValue];
  }

  submit(user) {
    delete user.email;
    this.usersService.updateUser(user)
      .take(1)
      .subscribe(() => this.router.navigate(['/management']));
  }

  goBack() {
    this.router.navigate(['/management']);
  }
}
