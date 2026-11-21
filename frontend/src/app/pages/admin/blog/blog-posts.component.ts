import { DatePipe, DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';
import { finalize, forkJoin, Observable, Subscription } from 'rxjs';
import { BlogCategory, BlogPage } from '../../../site/blog/blog.types';
import {
  AdminBlogCard,
  AdminBlogPost,
  AdminBlogFilters,
  AdminBlogService,
  blogError,
  blogStatuses,
  statusOptions,
} from './admin-blog.service';

@Component({
  selector: 'app-blog-posts',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './blog-posts.component.html',
})
export class BlogPostsComponent {
  private readonly api = inject(AdminBlogService);
  private readonly router = inject(Router);
  private readonly toast = inject(HotToastService);
  private readonly destroy = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  protected readonly statuses = blogStatuses;
  protected readonly statusOptions = statusOptions;
  protected readonly result = signal<BlogPage<AdminBlogCard> | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly busy = signal(false);
  protected categories: BlogCategory[] = [];
  protected authors: { id: number; name: string }[] = [];
  protected filters: AdminBlogFilters = {
    search: '',
    category: '',
    status: '',
    authorId: '',
    sort: 'recent',
  };
  private applied: AdminBlogFilters = {};
  private request?: Subscription;

  constructor() {
    forkJoin({ categories: this.api.categories(), authors: this.api.authors() })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: ({ categories, authors }) => {
          this.categories = categories;
          this.authors = authors;
        },
        error: (error) =>
          this.toast.error(
            blogError(error, 'Não foi possível carregar os filtros.'),
          ),
      });
    this.load(1);
  }

  protected applyFilters() {
    this.applied = { ...this.filters };
    this.load(1);
  }

  protected load(page: number) {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    this.request = this.api
      .posts({ ...this.applied, page })
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (result) => {
          if (!result.items.length && page > 1)
            queueMicrotask(() =>
              this.load(Math.max(1, Math.ceil(result.total / result.pageSize))),
            );
          else this.result.set(result);
        },
        error: (error) => this.error.set(blogError(error)),
      });
  }

  protected action(
    post: AdminBlogCard,
    action: 'publish' | 'archive' | 'duplicate' | 'delete',
  ) {
    if (this.busy()) return;
    if (
      action === 'delete' &&
      !this.document.defaultView?.confirm(
        'Excluir esta publicação permanentemente?',
      )
    )
      return;
    this.busy.set(true);
    const request: Observable<void | AdminBlogPost> =
      action === 'delete'
        ? this.api.deletePost(post.id)
        : this.api.action(post.id, action);
    request
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: (saved) => {
          this.toast.success('Publicação atualizada.');
          if (action === 'duplicate' && saved) {
            void this.router.navigate(['/admin/blog/publicacoes', saved.id]);
          } else {
            this.load(this.result()?.page ?? 1);
          }
        },
        error: (error) => this.toast.error(blogError(error)),
      });
  }
}
