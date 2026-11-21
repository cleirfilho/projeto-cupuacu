import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  DestroyRef,
  inject,
  Injectable,
  signal,
} from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'auto';

// Keep these values aligned with the first-paint script in index.html.
const storageKey = 'kupuassu-theme';
const systemQuery = '(prefers-color-scheme: dark)';

function parsePreference(value: string | null): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'auto';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly selection = signal<ThemePreference>('auto');
  private browser: Window | null = null;
  private systemTheme?: MediaQueryList;

  readonly preference = this.selection.asReadonly();

  constructor() {
    const destroy = inject(DestroyRef);
    const update = () => this.apply();

    afterNextRender(() => {
      this.browser = this.document.defaultView;
      if (!this.browser) return;

      this.systemTheme = this.browser.matchMedia(systemQuery);
      try {
        this.selection.set(
          parsePreference(this.browser.localStorage.getItem(storageKey)),
        );
      } catch {
        // Storage may be disabled by browser settings.
      }
      this.apply();
      this.systemTheme.addEventListener('change', update);
      destroy.onDestroy(() =>
        this.systemTheme?.removeEventListener('change', update),
      );
    });
  }

  setPreference(preference: ThemePreference): void {
    this.selection.set(preference);
    if (!this.browser) return;

    try {
      this.browser.localStorage.setItem(storageKey, preference);
    } catch {
      // The current page can still use the selected theme.
    }
    this.apply();
  }

  private apply(): void {
    const preference = this.preference();
    const resolved =
      preference === 'auto'
        ? this.systemTheme?.matches
          ? 'dark'
          : 'light'
        : preference;
    this.document.documentElement.setAttribute('data-bs-theme', resolved);
  }
}
