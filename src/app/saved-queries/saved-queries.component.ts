import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { QueryService } from '../query/query.service';
import { UsersService } from '../users/users.service';

export class UserSavedQuery {
  public constructor(
    public name: string,
    public description: string,
    public page: string,
    public uuid: string,
    public url: string
  ) {}
}

@Component({
  selector: 'gpf-saved-queries',
  templateUrl: './saved-queries.component.html',
  styleUrls: ['./saved-queries.component.css']
})
export class SavedQueriesComponent implements OnInit, OnDestroy {
  private subscription: Subscription;

  public genotypeQueries: Array<UserSavedQuery>;
  public phenotoolQueries: Array<UserSavedQuery>;
  public enrichmentQueries: Array<UserSavedQuery>;

  public constructor(
    private router: Router,
    private queryService: QueryService,
    private usersService: UsersService,
  ) {}

  public ngOnInit(): void {
    this.subscription = this.usersService.getUserInfoObservable()
      .subscribe((userInfo: { loggedIn: boolean }) => this.checkUserInfo(userInfo));
    this.updateQueries();
  }

  public ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private checkUserInfo(value: { loggedIn: boolean }): void {
    if (!value.loggedIn) {
      this.router.navigate(['/']);
    }
  }

  public updateQueries(): void {
    this.queryService.collectUserSavedQueries().subscribe((response: {queries: object[]}) => {
      const queries = response['queries'].map((query: object) => {
        if (
          typeof query['name'] === 'string'
          && typeof query['description'] === 'string'
          && typeof query['page'] === 'string'
          && typeof query['query_uuid'] === 'string'
        ) {
          return new UserSavedQuery(
            query['name'],
            query['description'],
            query['page'],
            query['query_uuid'],
            this.queryService.getLoadUrl(query['query_uuid'])
          );
        }
        return undefined;
      }
      );

      this.genotypeQueries = queries.filter(query => query.page === 'genotype');
      this.phenotoolQueries = queries.filter(query => query.page === 'phenotool');
      this.enrichmentQueries = queries.filter(query => query.page === 'enrichment');
    });
  }
}
