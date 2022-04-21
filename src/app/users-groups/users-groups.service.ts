import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserGroup } from './users-groups';
import { Dataset } from '../datasets/datasets';
import { ConfigService } from '../config/config.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class UsersGroupsService {
  private readonly groupsUrl = 'groups';
  private readonly groupGrantPermissionUrl = 'groups/grant-permission';
  private readonly groupRevokePermissionUrl = 'groups/revoke-permission';

  public constructor(
    private http: HttpClient,
    private config: ConfigService,
  ) {}

  public getAllGroups(): Observable<UserGroup[]> {
    const options = { withCredentials: true };

    return this.http.get(this.config.baseUrl + this.groupsUrl, options)
      .pipe(map((response: any) => UserGroup.fromJsonArray(response)));
  }

  public getGroup(groupId: number): Observable<UserGroup> {
    const options = { withCredentials: true };

    return this.http.get(`${this.config.baseUrl}${this.groupsUrl}/${groupId}`, options)
      .pipe(map((response: any) => UserGroup.fromJson(response)));
  }

  public grantPermission(groupName: string, dataset: Dataset): Observable<object> {
    const options = { withCredentials: true };

    return this.http.post(this.config.baseUrl + this.groupGrantPermissionUrl, {
      groupName: groupName,
      datasetId: dataset.id
    }, options);
  }

  public revokePermission(group: UserGroup, dataset: Dataset): Observable<object> {
    const options = { withCredentials: true };

    return this.http.post(this.config.baseUrl + this.groupRevokePermissionUrl, {
      groupId: group.id,
      datasetId: dataset.id
    }, options);
  }
}
