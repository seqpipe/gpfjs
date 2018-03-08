import { Injectable } from '@angular/core';
import { Headers, Http, Response, RequestOptions } from '@angular/http';
import { Observable, Scheduler } from 'rxjs';
import { ReplaySubject } from 'rxjs/ReplaySubject';
// import { Router } from '@angular/router';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/subscribeOn';

@Injectable()
export class StateRestoreService {
  private state = new ReplaySubject<any>(1);

  constructor(
    // private router: Router
  ) {
    // router.events
    //   .subscribe(params => {
    //     let newUrl = this.router.url.split(';')[0];
    //     if (this.firstUrl == null) {
    //       this.firstUrl = newUrl;
    //     } else if (!this.emptyObjectSend && this.firstUrl !== newUrl) {
    //       console.log("pushing empty state");
    //       this.pushNewState({});
    //       this.emptyObjectSend = true;
    //     }
    //   });
  }

  getState(key: string): Observable<any> {
    return this.state.asObservable().subscribeOn(Scheduler.async);
  }

  onParamsUpdate(jsonEncodedState: string) {
    if (jsonEncodedState && jsonEncodedState.length > 0) {
      let currentState = JSON.parse(jsonEncodedState);
      this.pushNewState(currentState);
    }
  }

  pushNewState(newState) {
    this.state.next(newState);
  }


}
