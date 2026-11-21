import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HotToastService } from '@ngxpert/hot-toast';
import { finalize } from 'rxjs';
import {
  AdminBlogService,
  BlogSettings,
  blogError,
} from './admin-blog.service';

@Component({
  selector: 'app-blog-settings',
  imports: [FormsModule],
  templateUrl: './blog-settings.component.html',
})
export class BlogSettingsComponent {
  private readonly api = inject(AdminBlogService);
  private readonly destroy = inject(DestroyRef);
  private readonly toast = inject(HotToastService);
  protected readonly settings = signal<BlogSettings | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  constructor() {
    this.api
      .settings()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (settings) => this.settings.set(settings),
        error: (error) => this.error.set(blogError(error)),
      });
  }

  protected save(settings: BlogSettings) {
    this.busy.set(true);
    this.api
      .saveSettings(settings)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: (saved) => {
          this.settings.set(saved);
          this.toast.success('Configurações salvas.');
        },
        error: (error) => this.toast.error(blogError(error)),
      });
  }
}
