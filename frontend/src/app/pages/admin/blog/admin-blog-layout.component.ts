import { Component, computed, inject } from '@angular/core';
import { isActive, Router, RouterLink, RouterOutlet } from '@angular/router';
import { NgbNav, NgbNavItem, NgbNavLinkBase } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-admin-blog-layout',
  imports: [NgbNav, NgbNavItem, NgbNavLinkBase, RouterLink, RouterOutlet],
  template: `
    <section class="pb-4">
      <header
        class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4"
      >
        <div>
          <p class="section-kicker mb-1">Gestão de conteúdo</p>
          <h2 class="h3 mb-0">Blog</h2>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <a class="btn btn-outline-primary" routerLink="/blog">Abrir blog</a>
          <a class="btn btn-primary" routerLink="nova">Nova publicação</a>
        </div>
      </header>
      <nav aria-label="Menu do blog">
        <ul
          ngbNav
          [roles]="false"
          [keyboard]="false"
          [activeId]="activePath()"
          (navChange)="$event.preventDefault()"
          class="nav-pills flex-wrap gap-2 mb-4"
        >
          @for (item of items; track item.path) {
            <li [ngbNavItem]="item.path">
              <a
                ngbNavLink
                class="border fw-semibold"
                [class.text-primary-emphasis]="activePath() !== item.path"
                [routerLink]="item.path"
                [attr.aria-current]="activePath() === item.path ? 'page' : null"
                >{{ item.label }}</a
              >
            </li>
          }
        </ul>
      </nav>
      <router-outlet />
    </section>
  `,
})
export class AdminBlogLayoutComponent {
  private readonly router = inject(Router);
  protected readonly items = [
    { label: 'Dashboard', path: '/admin/blog' },
    { label: 'Publicações', path: '/admin/blog/publicacoes' },
    { label: 'Categorias', path: '/admin/blog/categorias' },
    { label: 'Tags', path: '/admin/blog/tags' },
    { label: 'Configurações', path: '/admin/blog/configuracoes' },
  ].map((item) => ({
    ...item,
    active: isActive(item.path, this.router, {
      paths: item.path === '/admin/blog' ? 'exact' : 'subset',
      queryParams: 'ignored',
    }),
  }));
  protected readonly activePath = computed(
    () => this.items.find((item) => item.active())?.path ?? '',
  );
}
