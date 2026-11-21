import {
  afterNextRender,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BlogCardComponent } from './blog-card.component';
import { BlogService } from './blog.service';
import { BlogCard } from './blog.types';

@Component({
  selector: 'app-blog-home',
  imports: [BlogCardComponent, RouterLink],
  template: `
    @if (posts().length) {
      <section class="site-section bg-white" aria-labelledby="home-blog-title">
        <div class="container">
          <div class="section-heading mb-4">
            <span class="section-kicker">Blog</span>
            <h2 id="home-blog-title" class="section-title mt-3">
              Novidades e Conteúdos
            </h2>
            <p class="section-copy mb-0">
              Acompanhe nossas novidades, informações e conteúdos especiais.
            </p>
          </div>
          <div class="row g-3 g-lg-4">
            @for (post of posts(); track post.id) {
              <div class="col-sm-6 col-lg-4">
                <app-blog-card [post]="post" [home]="true" />
              </div>
            }
          </div>
          <a class="btn btn-outline-primary mt-4" routerLink="/blog"
            >Ver todas as publicações</a
          >
        </div>
      </section>
    }
  `,
})
export class BlogHomeComponent {
  private readonly blog = inject(BlogService);
  private readonly destroy = inject(DestroyRef);
  protected readonly posts = signal<BlogCard[]>([]);

  constructor() {
    afterNextRender(() =>
      this.blog
        .featured(true)
        .pipe(takeUntilDestroyed(this.destroy))
        .subscribe({
          next: (posts) => this.posts.set(posts),
          error: () => this.posts.set([]),
        }),
    );
  }
}
