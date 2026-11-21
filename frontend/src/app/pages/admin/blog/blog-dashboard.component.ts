import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  AdminBlogService,
  BlogDashboard,
  blogError,
  blogStatuses,
} from './admin-blog.service';

@Component({
  selector: 'app-blog-dashboard',
  imports: [RouterLink, DatePipe],
  templateUrl: './blog-dashboard.component.html',
  styleUrl: './blog-dashboard.component.css',
})
export class BlogDashboardComponent {
  private readonly api = inject(AdminBlogService);
  private readonly destroy = inject(DestroyRef);
  protected readonly data = signal<BlogDashboard | null>(null);
  protected readonly error = signal('');
  protected readonly statuses = blogStatuses;
  protected readonly chart = computed(() => {
    const views = new Map(this.data()?.days.map((row) => [row.day, row.views]));
    const today = Date.now();
    const peak = Math.max(1, ...views.values());
    return Array.from({ length: 30 }, (_, index) => {
      const day = new Date(today - (29 - index) * 86_400_000)
        .toISOString()
        .slice(0, 10);
      const count = views.get(day) ?? 0;
      return { day, count, percent: (100 * count) / peak };
    });
  });

  constructor() {
    this.api
      .dashboard()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (data) => this.data.set(data),
        error: (error) => this.error.set(blogError(error)),
      });
  }
}
