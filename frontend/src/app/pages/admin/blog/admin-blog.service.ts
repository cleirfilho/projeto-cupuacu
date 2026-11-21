import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { blogParams } from '../../../site/blog/blog.service';
import {
  BlogArticle,
  BlogCard,
  BlogCategory,
  BlogFilters,
  BlogHeading,
  BlogPage,
  BlogTerm,
} from '../../../site/blog/blog.types';

export const blogStatuses = {
  RASCUNHO: 'Rascunho',
  AGENDADO: 'Agendado',
  PUBLICADO: 'Publicado',
  ARQUIVADO: 'Arquivado',
};
export type BlogStatus = keyof typeof blogStatuses;
export const statusOptions = Object.entries(blogStatuses);

export interface AdminBlogFilters extends BlogFilters {
  status?: BlogStatus | '';
  authorId?: number | '';
  from?: string;
  to?: string;
  sort?: string;
}

export interface AdminBlogCard extends BlogCard {
  authorId: number | null;
  status: BlogStatus;
  scheduledAt: string | null;
}
export interface AdminBlogPost extends AdminBlogCard, BlogArticle {
  categoryId: number;
  tagIds: number[];
}
export interface BlogPostInput {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  featuredImageAlt: string;
  categoryId: number;
  tagIds: number[];
  status: BlogStatus;
  isFeatured: boolean;
  isPinned: boolean;
  allowIndexing: boolean;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  scheduledAt?: string;
}
export interface BlogSettings extends BlogHeading {
  pageSize: number;
  homeCount: number;
  popularCount: number;
  homeEnabled: boolean;
}
export interface BlogDashboard {
  total: number;
  views: number;
  statuses: Partial<Record<BlogStatus, number>>;
  days: { day: string; views: number }[];
  popular: BlogCard[];
  recent: AdminBlogCard[];
}

export function blogError(
  error: unknown,
  fallback = 'Não foi possível concluir a operação.',
) {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  if (error.status === 401) return 'A sessão expirou. Entre novamente.';
  if (error.status === 403)
    return 'Esta ação está disponível apenas para administradores.';
  const message: unknown = error.error?.message;
  return typeof message === 'string'
    ? message
    : Array.isArray(message)
      ? message.join(' ')
      : fallback;
}

@Injectable({ providedIn: 'root' })
export class AdminBlogService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly api = '/api/admin/blog';

  private options(query = {}) {
    return {
      headers: {
        Authorization: 'Bearer ' + (this.auth.getAccessToken() ?? ''),
      },
      params: blogParams(query),
    };
  }

  openMediaSession() {
    return this.http.post<void>(
      this.api + '/media/session',
      {},
      this.options(),
    );
  }

  closeMediaSession() {
    return this.http.delete<void>(this.api + '/media/session', this.options());
  }

  dashboard() {
    return this.http.get<BlogDashboard>(
      this.api + '/dashboard',
      this.options(),
    );
  }

  settings() {
    return this.http.get<BlogSettings>(this.api + '/settings', this.options());
  }

  saveSettings(settings: BlogSettings) {
    const {
      pageSize,
      homeCount,
      popularCount,
      homeEnabled,
      title,
      description,
    } = settings;
    return this.http.patch<BlogSettings>(
      this.api + '/settings',
      {
        pageSize,
        homeCount,
        popularCount,
        homeEnabled,
        title,
        description,
      },
      this.options(),
    );
  }

  posts(filters: AdminBlogFilters) {
    return this.http.get<BlogPage<AdminBlogCard>>(
      this.api + '/posts',
      this.options(filters),
    );
  }

  authors() {
    return this.http.get<{ id: number; name: string }[]>(
      this.api + '/authors',
      this.options(),
    );
  }

  post(id: number) {
    return this.http.get<AdminBlogPost>(
      this.api + '/posts/' + id,
      this.options(),
    );
  }

  savePost(data: BlogPostInput, id?: number) {
    return id === undefined
      ? this.http.post<AdminBlogPost>(this.api + '/posts', data, this.options())
      : this.http.patch<AdminBlogPost>(
          this.api + '/posts/' + id,
          data,
          this.options(),
        );
  }

  action(id: number, action: 'publish' | 'archive' | 'duplicate') {
    return this.http.post<AdminBlogPost>(
      this.api + '/posts/' + id + '/' + action,
      {},
      this.options(),
    );
  }

  deletePost(id: number) {
    return this.http.delete<void>(this.api + '/posts/' + id, this.options());
  }

  categories() {
    return this.http.get<BlogCategory[]>(
      this.api + '/categories',
      this.options(),
    );
  }

  saveCategory(
    category: Omit<BlogCategory, 'id' | 'slug'> & { slug?: string },
    id?: number,
  ) {
    return id === undefined
      ? this.http.post<BlogCategory>(
          this.api + '/categories',
          category,
          this.options(),
        )
      : this.http.patch<BlogCategory>(
          this.api + '/categories/' + id,
          category,
          this.options(),
        );
  }

  tags(search = '', page = 1) {
    return this.http.get<BlogPage<BlogTerm>>(
      this.api + '/tags',
      this.options({ search, page }),
    );
  }

  saveTag(tag: { name: string; slug?: string }, id?: number) {
    return id === undefined
      ? this.http.post<BlogTerm>(this.api + '/tags', tag, this.options())
      : this.http.patch<BlogTerm>(
          this.api + '/tags/' + id,
          tag,
          this.options(),
        );
  }

  deleteTerm(kind: 'categories' | 'tags', id: number) {
    return this.http.delete<void>(
      this.api + '/' + kind + '/' + id,
      this.options(),
    );
  }

  upload(file: File) {
    const data = new FormData();
    data.append('image', file);
    return this.http.post<{ url: string }>(
      this.api + '/media',
      data,
      this.options(),
    );
  }

  preview(content: string) {
    return this.http.post<{ content: string }>(
      this.api + '/preview',
      { content },
      this.options(),
    );
  }
}
