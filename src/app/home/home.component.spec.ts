import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeComponent } from './home.component';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { ConfigService } from 'app/config/config.service';
import { DatasetsService } from 'app/datasets/datasets.service';
import { UsersService } from 'app/users/users.service';
import { StateStream, Store } from '@ngxs/store';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async() => {
    await TestBed.configureTestingModule({
      declarations: [HomeComponent],
      providers: [
        HttpClient,
        HttpHandler,
        ConfigService,
        DatasetsService,
        UsersService,
        Store,
        StateStream,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it.skip('should create', () => {
    expect(component).toBeTruthy();
  });
});
