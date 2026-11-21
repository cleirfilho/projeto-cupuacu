import { DatePipe, DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { BlogCardComponent } from './blog-card.component';
import type { BlogArticleData } from './blog.routes';
import { BlogSeoService } from './blog-seo.service';
import { BlogService } from './blog.service';
import { blogShareLinks } from './blog-share';

@Component({
  imports: [DatePipe, RouterLink, BlogCardComponent],
  providers: [BlogSeoService],
  templateUrl: './blog-article.component.html',
  styleUrl: './blog-article.component.css',
})
export class BlogArticleComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(BlogSeoService);
  private readonly blog = inject(BlogService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);
  private readonly destroy = inject(DestroyRef);
  private readonly clientReady = signal(false);
  private lastViewed?: string;
  protected readonly model = toSignal(
    this.route.data.pipe(map((data) => data['blog'] as BlogArticleData)),
    { requireSync: true },
  );
  protected readonly canonical = computed(() => {
    const data = this.model();
    return (
      this.seo.origin +
      ('article' in data ? '/blog/' + data.article.slug : '/blog')
    );
  });
  protected readonly shareLinks = computed(() => {
    const data = this.model();
    return 'article' in data
      ? blogShareLinks(this.canonical(), data.article.title)
      : [];
  });
  protected readonly shareMessage = signal('');
  protected readonly nativeShare = computed(
    () => this.clientReady() && !!this.document.defaultView?.navigator.share,
  );

  constructor() {
    afterNextRender(() => this.clientReady.set(true));
    effect(() => {
      const data = this.model();
      this.shareMessage.set('');
      if ('error' in data) {
        this.seo.apply({
          title:
            data.error === 404
              ? 'Publicação não encontrada'
              : 'Publicação indisponível',
          description: '',
          path: this.route.snapshot.url
            .map((part) => part.path)
            .join('/')
            .replace(/^/, '/blog/'),
          index: false,
        });
        return;
      }
      const { article } = data;
      this.seo.apply({
        title: article.metaTitle || article.title,
        description: article.metaDescription || article.excerpt,
        path: '/blog/' + article.slug,
        image: article.ogImage || article.featuredImage,
        imageAlt: article.ogImage ? '' : article.featuredImageAlt,
        index: article.allowIndexing,
        article,
      });
    });
    effect(() => {
      const data = this.model();
      if (
        this.browser &&
        this.clientReady() &&
        'article' in data &&
        this.lastViewed !== data.article.slug
      ) {
        const slug = data.article.slug;
        this.lastViewed = slug;
        this.blog
          .view(slug)
          .pipe(takeUntilDestroyed(this.destroy))
          .subscribe({ error: () => undefined });
      }
    });
  }

  protected async copy() {
    try {
      const clipboard = this.document.defaultView?.navigator.clipboard;
      if (!clipboard) throw new Error('Clipboard indisponível');
      await clipboard.writeText(this.canonical());
      this.shareMessage.set('Link copiado.');
    } catch {
      this.shareMessage.set('Copie o endereço exibido abaixo.');
    }
  }

  protected async share() {
    const data = this.model();
    if (!('article' in data)) return;
    try {
      await this.document.defaultView?.navigator.share({
        title: data.article.title,
        url: this.canonical(),
      });
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        this.shareMessage.set(
          'Use uma das opções de compartilhamento ou copie o link.',
        );
      }
    }
  }
}
