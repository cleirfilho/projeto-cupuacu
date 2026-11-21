import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  inject,
  Injectable,
  InjectionToken,
  REQUEST,
  TransferState,
  makeStateKey,
} from '@angular/core';
import {
  BlogArticle,
  BlogCard,
  BlogCategory,
  BlogFilters,
  BlogHeading,
  BlogPage,
} from './blog.types';

export const BLOG_API_ORIGIN = new InjectionToken<string>('BLOG_API_ORIGIN', {
  factory: () => inject(DOCUMENT).location?.origin ?? '',
});
export const BLOG_SITE_ORIGIN = new InjectionToken<string>('BLOG_SITE_ORIGIN', {
  factory: () => inject(DOCUMENT).location?.origin ?? '',
});
const siteOriginKey = makeStateKey<string>('blog-site-origin');

export function blogOrigin() {
  const transfer = inject(TransferState);
  const origin = transfer.get(siteOriginKey, inject(BLOG_SITE_ORIGIN));
  if (inject(REQUEST)) transfer.set(siteOriginKey, origin);
  return origin;
}

export function blogParams(values: object) {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') params = params.set(key, value);
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(BLOG_API_ORIGIN) + '/api/blog';

  heading() {
    return this.http.get<BlogHeading>(this.api + '/settings');
  }

  posts(filters: BlogFilters) {
    return this.http.get<BlogPage<BlogCard>>(this.api + '/posts', {
      params: blogParams(filters),
    });
  }

  categories() {
    return this.http.get<BlogCategory[]>(this.api + '/categories');
  }

  featured(home = false) {
    return this.http.get<BlogCard[]>(this.api + '/posts/featured', {
      params: home ? { context: 'home' } : {},
    });
  }

  popular() {
    return this.http.get<BlogCard[]>(this.api + '/posts/popular');
  }

  article(slug: string) {
    return this.http.get<BlogArticle>(
      this.api + '/posts/' + encodeURIComponent(slug),
    );
  }

  related(slug: string) {
    return this.http.get<BlogCard[]>(
      this.api + '/posts/' + encodeURIComponent(slug) + '/related',
    );
  }

  view(slug: string) {
    return this.http.post<void>(
      this.api + '/posts/' + encodeURIComponent(slug) + '/view',
      {},
    );
  }
}
