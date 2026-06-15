import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly accessTokenKey = 'kupuassu_access_token';
  private readonly refreshTokenKey = 'kupuassu_refresh_token';

  login(email: string, senha: string): Observable<void> {
    return this.http
      .post<AuthTokens>('/api/auth/login', { email: email.trim(), senha })
      .pipe(
        tap(({ accessToken, refreshToken }) => {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.accessTokenKey, accessToken);
            localStorage.setItem(this.refreshTokenKey, refreshToken);
          }
        }),
        map(() => undefined),
      );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.accessTokenKey);
      localStorage.removeItem(this.refreshTokenKey);
    }
  }

  isAuthenticated(): boolean {
    return Boolean(this.getAccessToken());
  }

  getAccessToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    return localStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    return localStorage.getItem(this.refreshTokenKey);
  }
}
