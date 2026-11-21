import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeService } from './theme.service';

@Component({ template: '' })
class ThemeHost {
  readonly theme = inject(ThemeService);
}

describe('ThemeService', () => {
  const storageKey = 'kupuassu-theme';
  let system: MediaQueryList;

  beforeEach(() => {
    system = Object.assign(new EventTarget(), {
      matches: true,
    }) as MediaQueryList;
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => system),
    );
    window.localStorage.removeItem(storageKey);
  });

  afterEach(() => {
    window.localStorage.removeItem(storageKey);
    document.documentElement.removeAttribute('data-bs-theme');
    vi.unstubAllGlobals();
  });

  function initializeTheme(): ThemeService {
    const fixture = TestBed.createComponent(ThemeHost);
    fixture.detectChanges();
    return fixture.componentInstance.theme;
  }

  function changeSystemTheme(matches: boolean): void {
    Object.assign(system, { matches });
    system.dispatchEvent(new Event('change'));
  }

  it('follows the system initially and after a system change', () => {
    const theme = initializeTheme();
    expect(theme.preference()).toBe('auto');
    expect(document.documentElement.dataset['bsTheme']).toBe('dark');

    changeSystemTheme(false);

    expect(document.documentElement.dataset['bsTheme']).toBe('light');
  });

  it('restores a saved preference and persists a new selection', () => {
    window.localStorage.setItem(storageKey, 'light');
    const theme = initializeTheme();
    expect(document.documentElement.dataset['bsTheme']).toBe('light');

    changeSystemTheme(false);
    changeSystemTheme(true);
    expect(document.documentElement.dataset['bsTheme']).toBe('light');

    theme.setPreference('dark');
    expect(window.localStorage.getItem(storageKey)).toBe('dark');
    expect(document.documentElement.dataset['bsTheme']).toBe('dark');

    theme.setPreference('auto');
    changeSystemTheme(false);
    expect(window.localStorage.getItem(storageKey)).toBe('auto');
    expect(document.documentElement.dataset['bsTheme']).toBe('light');
  });
});
