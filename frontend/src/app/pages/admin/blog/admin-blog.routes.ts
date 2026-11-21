import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';
import { catchError, map, of } from 'rxjs';
import { AdminBlogService, blogError } from './admin-blog.service';

const blogAdminGuard: CanActivateFn = () => {
  const blog = inject(AdminBlogService);
  const router = inject(Router);
  const toast = inject(HotToastService);
  return blog.openMediaSession().pipe(
    map(() => true),
    catchError((error) => {
      toast.error(blogError(error));
      return of(
        router.createUrlTree(
          error.status === 401 ? ['/login'] : ['/admin/dashboard'],
        ),
      );
    }),
  );
};

export const adminBlogRoutes: Routes = [
  {
    path: '',
    canActivateChild: [blogAdminGuard],
    loadComponent: () =>
      import('./admin-blog-layout.component').then(
        (module) => module.AdminBlogLayoutComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./blog-dashboard.component').then(
            (module) => module.BlogDashboardComponent,
          ),
      },
      {
        path: 'publicacoes',
        loadComponent: () =>
          import('./blog-posts.component').then(
            (module) => module.BlogPostsComponent,
          ),
      },
      {
        path: 'nova',
        loadComponent: () =>
          import('./blog-post-form.component').then(
            (module) => module.BlogPostFormComponent,
          ),
      },
      {
        path: 'publicacoes/:id',
        loadComponent: () =>
          import('./blog-post-form.component').then(
            (module) => module.BlogPostFormComponent,
          ),
      },
      {
        path: 'categorias',
        data: { taxonomy: 'categories' },
        loadComponent: () =>
          import('./blog-terms.component').then(
            (module) => module.BlogTermsComponent,
          ),
      },
      {
        path: 'tags',
        data: { taxonomy: 'tags' },
        loadComponent: () =>
          import('./blog-terms.component').then(
            (module) => module.BlogTermsComponent,
          ),
      },
      {
        path: 'configuracoes',
        loadComponent: () =>
          import('./blog-settings.component').then(
            (module) => module.BlogSettingsComponent,
          ),
      },
    ],
  },
];
