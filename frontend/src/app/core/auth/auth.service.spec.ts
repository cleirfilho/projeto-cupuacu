import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(AuthService);
  });

  it('should authenticate when credentials are filled', () => {
    expect(service.login('admin@cupuacu.local', 'senha')).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should reject empty credentials', () => {
    expect(service.login('', '')).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should remove the token on logout', () => {
    service.login('admin@cupuacu.local', 'senha');
    service.logout();
    expect(service.isAuthenticated()).toBe(false);
  });
});
