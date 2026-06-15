import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly tokenKey = 'cupuacu_auth_token';

  login(email: string, senha: string): boolean {
    if (!email.trim() || !senha.trim()) {
      return false;
    }

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.tokenKey, 'fake-cupuacu-token');
    }

    return true;
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
    }
  }

  isAuthenticated(): boolean {
    return (
      isPlatformBrowser(this.platformId) &&
      Boolean(localStorage.getItem(this.tokenKey))
    );
  }
}
