import { HttpErrorResponse } from '@angular/common/http';
import { inject, RESPONSE_INIT } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { BlogService } from './blog.service';
import {
  BlogArticle,
  BlogCard,
  BlogCategory,
  BlogFilters,
  BlogHeading,
  BlogPage,
} from './blog.types';

export interface BlogIndex {
  heading: BlogHeading;
  posts: BlogPage<BlogCard>;
  categories: BlogCategory[];
  featured: BlogCard[];
  popular: BlogCard[];
  filters: BlogFilters;
}
export type BlogIndexData = BlogIndex | { error: true };
export type BlogArticleData =
  | { article: BlogArticle; related: BlogCard[] }
  | { error: number };

export const resolveBlog: ResolveFn<BlogIndexData> = ({ queryParamMap }) => {
  const blog = inject(BlogService);
  const response = inject(RESPONSE_INIT, { optional: true });
  const page = Number(queryParamMap.get('page'));
  const filters = {
    page: Number.isInteger(page) && page >= 1 && page <= 100000 ? page : 1,
    search: queryParamMap.get('search')?.trim().slice(0, 120) || undefined,
    category: validSlug(queryParamMap.get('category')),
    tag: validSlug(queryParamMap.get('tag')),
  };
  const showFeatured =
    filters.page === 1 && !filters.search && !filters.category && !filters.tag;
  return forkJoin({
    heading: blog.heading(),
    posts: blog.posts(filters),
    categories: blog.categories(),
    featured: showFeatured ? blog.featured() : of([]),
    popular: blog.popular(),
    filters: of(filters),
  }).pipe(
    catchError(() => {
      if (response) response.status = 503;
      return of({ error: true } as const);
    }),
  );
};

export const resolveArticle: ResolveFn<BlogArticleData> = ({ paramMap }) => {
  const blog = inject(BlogService);
  const response = inject(RESPONSE_INIT, { optional: true });
  const slug = validSlug(paramMap.get('slug'));
  if (!slug) {
    if (response) response.status = 404;
    return { error: 404 };
  }
  return blog.article(slug).pipe(
    switchMap((article) =>
      forkJoin({
        article: of(article),
        related: blog.related(slug).pipe(catchError(() => of([]))),
      }),
    ),
    catchError((error: HttpErrorResponse) => {
      const status = error.status === 404 ? 404 : 503;
      if (response) response.status = status;
      return of({ error: status });
    }),
  );
};

function validSlug(value: string | null) {
  return value &&
    value.length <= 150 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
    ? value
    : undefined;
}

export const blogRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./blog-layout.component').then(
        (module) => module.BlogLayoutComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        resolve: { blog: resolveBlog },
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        loadComponent: () =>
          import('./blog-index.component').then(
            (module) => module.BlogIndexComponent,
          ),
      },
      {
        path: ':slug',
        resolve: { blog: resolveArticle },
        loadComponent: () =>
          import('./blog-article.component').then(
            (module) => module.BlogArticleComponent,
          ),
      },
    ],
  },
];
