import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should authenticate with tokens returned by the API', () => {
    service.login('admin@cupuacu.local', 'Admin@123').subscribe();

    const request = httpTesting.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'admin@cupuacu.local',
      senha: 'Admin@123',
    });
    request.flush({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.getAccessToken()).toBe('access-token');
    expect(service.getRefreshToken()).toBe('refresh-token');
  });

  it('should remove authentication tokens on logout', () => {
    localStorage.setItem('kupuassu_access_token', 'access-token');
    localStorage.setItem('kupuassu_refresh_token', 'refresh-token');

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.getRefreshToken()).toBeNull();
  });
});
