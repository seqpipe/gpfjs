import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { Observable, ReplaySubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, share, switchMap, take, tap } from 'rxjs/operators';

import { User } from '../users/users';
import { UsersService } from '../users/users.service';

@Component({
  selector: 'gpf-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {

  input$ = new ReplaySubject<string>(1);
  users: User[] = [];
  usersToShow$: Observable<User[]>;
  @ViewChild('searchBox') private searchBox: ElementRef;

  constructor(
    private usersService: UsersService,
    private router: Router,
    private route: ActivatedRoute
    ) { }

  ngOnInit() {
    this.focusSearchBox();
    this.usersToShow$ = this.input$.pipe(
      map(searchTerm => searchTerm.trim()),
      debounceTime(300),
      distinctUntilChanged(),
      tap(searchTerm => {
        this.users = [];
        let queryParamsObject: any = {};
        if (searchTerm) {
          queryParamsObject.search =  searchTerm;
        }
        this.router.navigate(['.'], {
          relativeTo: this.route,
          replaceUrl: true,
          queryParams: queryParamsObject
        });
      }),
      switchMap(searchTerm => this.usersService.searchUsersByGroup(searchTerm)),
      map(user => {
        this.users.push(this.sortGroups(user));
        return this.users;
      }),
      share()
    );

    this.route.queryParamMap.pipe(
      map(params => params.get('search') || ''),
      take(1)
    ).subscribe(searchTerm => {
      this.search(searchTerm);
    });
  }

  search(value: string) {
    this.input$.next(value);
  }

  sortGroups(user: User): User {
    if (!user || !user.groups) {
      return user;
    }
    let defaultGroups = user.groups
      .filter(group => user.getDefaultGroups().indexOf(group) !== -1);
    let otherGroups = user.groups
      .filter(group => user.getDefaultGroups().indexOf(group) === -1);

    if (defaultGroups.length === 2 && defaultGroups[0] !== 'any_user') {
      let group = defaultGroups[0];
      defaultGroups[0] = defaultGroups[1];
      defaultGroups[1] = group;
    }

    otherGroups = otherGroups
      .sort((group1, group2) => group1.localeCompare(group2));

    user.groups = defaultGroups.concat(otherGroups);
    return user;
  }

  /**
  * Waits search box element to load.
  * @returns promise
  */
   private async waitForSearchBoxToLoad(): Promise<void> {
    return new Promise<void>(resolve => {
      const timer = setInterval(() => {
        if (this.searchBox !== undefined) {
          resolve();
          clearInterval(timer);
        }
      }, 100);
    });
  }

  public focusSearchBox() {
    this.waitForSearchBoxToLoad().then(() => {
      this.searchBox.nativeElement.focus();
    });
  }
}
