import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
} from '@angular/router';
import { map } from 'rxjs';
import { BlogCardComponent } from './blog-card.component';
import { BlogPopularComponent } from './blog-popular.component';
import type { BlogIndexData } from './blog.routes';
import { BlogSeoService } from './blog-seo.service';

@Component({
  imports: [FormsModule, RouterLink, BlogCardComponent, BlogPopularComponent],
  providers: [BlogSeoService],
  templateUrl: './blog-index.component.html',
})
export class BlogIndexComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(BlogSeoService);
  protected readonly model = toSignal(
    this.route.data.pipe(map((data) => data['blog'] as BlogIndexData)),
    { requireSync: true },
  );
  private readonly navigation = toSignal(this.router.events);
  protected readonly pending = signal(false);
  protected search = '';
  protected category = '';

  constructor() {
    effect(() => {
      const model = this.model();
      if ('error' in model) {
        this.seo.apply({
          title: 'Blog indisponível',
          description: '',
          path: '/blog',
          index: false,
        });
        return;
      }
      const { filters, heading, posts } = model;
      this.search = filters.search ?? '';
      this.category = filters.category ?? '';
      this.seo.apply({
        ...heading,
        path:
          '/blog' +
          (filters.page && filters.page > 1 ? '?page=' + filters.page : ''),
        index:
          !filters.search &&
          !filters.category &&
          !filters.tag &&
          (posts.page === 1 || posts.items.length > 0),
      });
    });
    effect(() => {
      const event = this.navigation();
      if (event instanceof NavigationStart) this.pending.set(true);
      if (
        event instanceof NavigationCancel ||
        event instanceof NavigationEnd ||
        event instanceof NavigationError
      ) {
        this.pending.set(false);
      }
    });
  }

  protected filter() {
    void this.router.navigate(['/blog'], {
      queryParams: {
        search: this.search.trim() || null,
        category: this.category || null,
      },
    });
  }
}
