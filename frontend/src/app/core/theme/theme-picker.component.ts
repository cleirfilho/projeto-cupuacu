import { Component, computed, inject } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { ThemePreference, ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-picker',
  imports: [NgbDropdownModule],
  template: `
    <div
      ngbDropdown
      #dropdown="ngbDropdown"
      display="static"
      placement="bottom-end"
      class="d-inline-block"
    >
      <button
        type="button"
        #toggle
        ngbDropdownToggle
        class="btn btn-outline-primary"
        [attr.aria-label]="'Aparência: ' + selected().label"
      >
        <i [class]="selected().icon" aria-hidden="true"></i>
      </button>
      <div ngbDropdownMenu class="dropdown-menu-end" aria-label="Aparência">
        @for (option of options; track option.value) {
          <button
            type="button"
            ngbDropdownItem
            [class.active]="theme.preference() === option.value"
            [attr.aria-pressed]="theme.preference() === option.value"
            (click)="
              theme.setPreference(option.value);
              dropdown.close();
              toggle.focus()
            "
          >
            <i [class]="option.icon + ' me-2'" aria-hidden="true"></i>
            {{ option.label }}
          </button>
        }
      </div>
    </div>
  `,
})
export class ThemePickerComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly options = [
    { value: 'light', label: 'Claro', icon: 'bi bi-sun' },
    { value: 'dark', label: 'Escuro', icon: 'bi bi-moon-stars' },
    { value: 'auto', label: 'Automático', icon: 'bi bi-display' },
  ] as const satisfies ReadonlyArray<{
    value: ThemePreference;
    label: string;
    icon: string;
  }>;

  protected readonly selected = computed(
    () =>
      this.options.find(({ value }) => value === this.theme.preference()) ??
      this.options[2],
  );
}
