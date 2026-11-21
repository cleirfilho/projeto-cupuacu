import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';
import { finalize, forkJoin, of } from 'rxjs';
import { blogOrigin } from '../../../site/blog/blog.service';
import {
  BlogCategory,
  BlogPage,
  BlogTerm,
} from '../../../site/blog/blog.types';
import {
  AdminBlogService,
  BlogPostInput,
  blogError,
  statusOptions,
} from './admin-blog.service';
import { BlogEditorComponent } from './blog-editor.component';

function localDate(iso: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

@Component({
  selector: 'app-blog-post-form',
  imports: [FormsModule, RouterLink, BlogEditorComponent],
  templateUrl: './blog-post-form.component.html',
  styleUrl: './blog-post-form.component.css',
})
export class BlogPostFormComponent {
  private readonly api = inject(AdminBlogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(HotToastService);
  private readonly destroy = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  protected readonly origin = blogOrigin();
  protected readonly statuses = statusOptions;
  protected readonly id = this.route.snapshot.paramMap.get('id');
  protected readonly published = signal(false);
  protected readonly ready = signal(false);
  protected readonly busy = signal(false);
  protected readonly imageBusy = signal(false);
  protected readonly inlineImageBusy = signal(false);
  protected readonly previewBusy = signal(false);
  protected readonly error = signal('');
  protected readonly preview = signal<string | null>(null);
  protected readonly tags = signal<BlogPage<BlogTerm> | null>(null);
  protected readonly tagsBusy = signal(false);
  protected readonly selected = signal<BlogTerm[]>([]);
  protected categories: BlogCategory[] = [];
  protected initialContent = '';
  protected tagSearch = '';
  private appliedTagSearch = '';
  protected schedule = '';
  protected model: BlogPostInput = {
    title: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    featuredImageAlt: '',
    categoryId: 0,
    tagIds: [],
    status: 'RASCUNHO',
    isFeatured: false,
    isPinned: false,
    allowIndexing: true,
    metaTitle: '',
    metaDescription: '',
    ogImage: '',
  };

  constructor() {
    if (
      this.id !== null &&
      (!Number.isSafeInteger(Number(this.id)) || Number(this.id) < 1)
    ) {
      this.error.set('Publicação inválida.');
      return;
    }
    forkJoin({
      categories: this.api.categories(),
      post: this.id === null ? of(null) : this.api.post(Number(this.id)),
    })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: ({ categories, post }) => {
          this.categories = categories;
          if (post) {
            const {
              title,
              slug,
              excerpt,
              content,
              featuredImage,
              featuredImageAlt,
              categoryId,
              tagIds,
              status,
              isFeatured,
              isPinned,
              allowIndexing,
              metaTitle,
              metaDescription,
              ogImage,
            } = post;
            this.model = {
              title,
              slug,
              excerpt,
              content,
              featuredImage,
              featuredImageAlt,
              categoryId,
              tagIds,
              status,
              isFeatured,
              isPinned,
              allowIndexing,
              metaTitle,
              metaDescription,
              ogImage,
            };
            this.initialContent = this.model.content;
            this.schedule = localDate(post.scheduledAt);
            this.selected.set(post.tags);
            this.published.set(
              post.status === 'PUBLICADO' &&
                categories.some(
                  (category) => category.id === categoryId && category.active,
                ),
            );
          }
          this.ready.set(true);
          if (this.route.snapshot.queryParamMap.has('preview'))
            this.showPreview();
        },
        error: (error) =>
          this.error.set(
            blogError(error, 'Não foi possível carregar a publicação.'),
          ),
      });
    this.loadTags(1);
  }

  protected suggestSlug(title: string) {
    return title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 130)
      .replace(/-$/, '');
  }

  protected filterTags() {
    this.appliedTagSearch = this.tagSearch.trim();
    this.loadTags(1);
  }

  protected loadTags(page: number) {
    if (this.tagsBusy()) return;
    this.tagsBusy.set(true);
    this.api
      .tags(this.appliedTagSearch, page)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.tagsBusy.set(false)),
      )
      .subscribe({
        next: (tags) => this.tags.set(tags),
        error: (error) =>
          this.toast.error(
            blogError(error, 'Não foi possível carregar as tags.'),
          ),
      });
  }

  protected hasTag(tag: BlogTerm) {
    return this.selected().some(({ id }) => id === tag.id);
  }

  protected toggleTag(tag: BlogTerm) {
    if (this.hasTag(tag)) {
      this.selected.update((tags) => tags.filter(({ id }) => id !== tag.id));
    } else if (this.selected().length < 30) {
      this.selected.update((tags) => [...tags, tag]);
    } else {
      this.toast.error('Cada publicação pode ter até 30 tags.');
    }
  }

  protected upload(event: Event, field: 'featuredImage' | 'ogImage') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.imageBusy()) return;
    this.imageBusy.set(true);
    this.api
      .upload(file)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.imageBusy.set(false)),
      )
      .subscribe({
        next: ({ url }) => (this.model[field] = url),
        error: (error) =>
          this.toast.error(
            blogError(error, 'Não foi possível enviar a imagem.'),
          ),
      });
  }

  protected showPreview() {
    if (this.previewBusy()) return;
    this.previewBusy.set(true);
    this.api
      .preview(this.model.content)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.previewBusy.set(false)),
      )
      .subscribe({
        next: ({ content }) => {
          this.preview.set(content);
          this.document.defaultView?.requestAnimationFrame(() =>
            this.document.getElementById('blog-preview')?.focus(),
          );
        },
        error: (error) =>
          this.toast.error(
            blogError(error, 'Não foi possível gerar a prévia.'),
          ),
      });
  }

  protected save() {
    if (this.busy() || this.imageBusy() || this.inlineImageBusy()) return;
    if (!this.model.title.trim() || !this.model.categoryId) {
      this.toast.error('Informe título e categoria.');
      return;
    }
    const date =
      this.model.status === 'AGENDADO' ? new Date(this.schedule) : null;
    if (date && !(date.getTime() > Date.now())) {
      this.toast.error('Informe uma data futura para o agendamento.');
      return;
    }
    this.busy.set(true);
    this.api
      .savePost(
        {
          ...this.model,
          slug: this.model.slug?.trim() || undefined,
          tagIds: this.selected().map(({ id }) => id),
          scheduledAt: date?.toISOString(),
        },
        this.id === null ? undefined : Number(this.id),
      )
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: (post) => {
          this.toast.success('Publicação salva.');
          if (this.id === null) {
            void this.router.navigate(['/admin/blog/publicacoes', post.id]);
          } else {
            this.model.slug = post.slug;
            this.model.status = post.status;
            this.schedule = localDate(post.scheduledAt);
            this.published.set(
              post.status === 'PUBLICADO' &&
                this.categories.some(
                  (category) =>
                    category.id === post.categoryId && category.active,
                ),
            );
          }
        },
        error: (error) => this.toast.error(blogError(error)),
      });
  }
}
