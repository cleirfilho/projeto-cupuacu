import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';
import { finalize, Observable, Subscription } from 'rxjs';
import {
  BlogCategory,
  BlogPage,
  BlogTerm,
} from '../../../site/blog/blog.types';
import { AdminBlogService, blogError } from './admin-blog.service';

@Component({
  selector: 'app-blog-terms',
  imports: [FormsModule],
  templateUrl: './blog-terms.component.html',
})
export class BlogTermsComponent {
  private readonly api = inject(AdminBlogService);
  private readonly toast = inject(HotToastService);
  private readonly destroy = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly taxonomy = inject(ActivatedRoute).snapshot.data[
    'taxonomy'
  ] as 'categories' | 'tags';
  protected readonly isCategory = this.taxonomy === 'categories';
  protected readonly terms = signal<(BlogCategory | BlogTerm)[]>([]);
  protected readonly page = signal<BlogPage<BlogTerm> | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected search = '';
  private appliedSearch = '';
  private request?: Subscription;
  protected id?: number;
  protected name = '';
  protected slug = '';
  protected description = '';
  protected order = 0;
  protected active = true;

  constructor() {
    this.load(1);
  }

  protected filter() {
    this.appliedSearch = this.search.trim();
    this.load(1);
  }

  protected load(page: number) {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    const request: Observable<BlogCategory[] | BlogPage<BlogTerm>> = this
      .isCategory
      ? this.api.categories()
      : this.api.tags(this.appliedSearch, page);
    this.request = request
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (data) => {
          if (Array.isArray(data)) this.terms.set(data);
          else {
            this.terms.set(data.items);
            this.page.set(data);
            if (!data.items.length && page > 1)
              queueMicrotask(() =>
                this.load(Math.max(1, Math.ceil(data.total / data.pageSize))),
              );
          }
        },
        error: (error) => this.error.set(blogError(error)),
      });
  }

  protected edit(term?: BlogTerm | BlogCategory) {
    const category = term && 'active' in term ? term : undefined;
    this.id = term?.id;
    this.name = term?.name ?? '';
    this.slug = term?.slug ?? '';
    this.description = category?.description ?? '';
    this.order = category?.displayOrder ?? 0;
    this.active = category?.active ?? true;
  }

  protected save() {
    const name = this.name.trim();
    if (!name || this.saving()) return;
    const input = { name, slug: this.slug.trim() || undefined };
    const request = this.isCategory
      ? this.api.saveCategory(
          {
            ...input,
            description: this.description,
            active: this.active,
            displayOrder: this.order,
          },
          this.id,
        )
      : this.api.saveTag(input, this.id);
    this.saving.set(true);
    request
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.toast.success('Registro salvo.');
          this.edit();
          this.load(this.page()?.page ?? 1);
        },
        error: (error) => this.toast.error(blogError(error)),
      });
  }

  protected remove(term: BlogTerm) {
    if (
      this.saving() ||
      !this.document.defaultView?.confirm(`Excluir “${term.name}”?`)
    )
      return;
    this.saving.set(true);
    this.api
      .deleteTerm(this.taxonomy, term.id)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.toast.success('Registro excluído.');
          if (this.id === term.id) this.edit();
          this.load(this.page()?.page ?? 1);
        },
        error: (error) => this.toast.error(blogError(error)),
      });
  }
}
