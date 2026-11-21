import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BlogCard } from './blog.types';

@Component({
  selector: 'app-blog-popular',
  imports: [DatePipe, RouterLink],
  template: `
    @if (posts().length) {
      <aside class="card border-0 shadow-sm p-4">
        <h2 class="h5 fw-bold mb-3">Mais acessados</h2>
        <ol class="list-unstyled mb-0">
          @for (post of posts(); track post.id) {
            <li class="border-top py-3">
              <a
                class="d-flex align-items-center gap-3 text-decoration-none text-body-emphasis"
                [routerLink]="['/blog', post.slug]"
              >
                @if (post.featuredImage) {
                  <img
                    class="rounded object-fit-cover flex-shrink-0"
                    [src]="post.featuredImage + '?variant=thumb'"
                    width="64"
                    height="56"
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                }
                <span class="text-break">
                  <strong class="d-block">{{ post.title }}</strong>
                  <time
                    class="small text-body-secondary"
                    [attr.datetime]="post.publishedAt"
                  >
                    {{ post.publishedAt | date: 'dd/MM/yyyy' : 'UTC' }}
                  </time>
                </span>
              </a>
            </li>
          }
        </ol>
      </aside>
    }
  `,
})
export class BlogPopularComponent {
  readonly posts = input.required<BlogCard[]>();
}
