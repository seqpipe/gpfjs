import { Component, Input } from '@angular/core';
import { User } from '../users/users';
import { UsersService } from '../users/users.service';
import { map, mergeMap, take } from 'rxjs/operators';
import { Item } from 'app/item-add-menu/item-add-menu';
import { UsersGroupsService } from 'app/users-groups/users-groups.service';
import { UserGroup } from 'app/users-groups/users-groups';
import { Observable } from 'rxjs';

@Component({
  selector: 'gpf-users-table',
  templateUrl: './users-table.component.html',
  styleUrls: ['./users-table.component.css'],
})
export class UsersTableComponent {
  @Input() public users: User[];
  @Input() public currentUserEmail: string;
  public currentUserEdit = -1;

  public constructor(
    private usersService: UsersService,
    private usersGroupsService: UsersGroupsService
  ) { }

  public isDefaultGroup(user: User, group: string): boolean {
    return user.getDefaultGroups().indexOf(group) !== -1;
  }

  public deleteUser(user: User): void {
    this.usersService.deleteUser(user).pipe(take(1)).subscribe(() => {
      this.users.splice(this.users.indexOf(user), 1);
    });
  }

  public resetPassword(user: User): void {
    this.usersService.resetPassword(user.email);
  }

  public removeGroup(user: User, group: string): void {
    this.usersGroupsService.removeUser(user.email, group).pipe(
      mergeMap(() => this.usersService.getUser(user.id))
    ).subscribe(updatedUser => {
      user.groups = updatedUser.groups;
      user.allowedDatasets = updatedUser.allowedDatasets;
    });
  }

  public addGroup(user: User, event$: Item): void {
    this.usersGroupsService.addUser(user.email, event$.name).pipe(
      mergeMap(() => this.usersService.getUser(user.id))
    ).subscribe(updatedUser => {
      user.groups = updatedUser.groups;
      user.allowedDatasets = updatedUser.allowedDatasets;
    });
  }

  public getGroupNamesFunction(user: User): (page: number, searchText: string) => Observable<Item[]> {
    return (page: number, searchText: string): Observable<Item[]> =>
      this.usersGroupsService.getGroups(page, searchText).pipe(
        map((groups: UserGroup[]) => groups
          .filter(group => !user.groups.includes(group.name))
          .map(group => new Item(group.id.toString(), group.name))
        ));
  }

  public edit(user: User, name: string): void {
    user.name = name;
    this.usersService.updateUser(user)
      .pipe(take(1))
      .subscribe(() => {
        user.name = name;
      });

    this.currentUserEdit = -1;
  }
}
