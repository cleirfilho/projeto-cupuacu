import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { blogOrigin } from './blog.service';
import { BlogArticle } from './blog.types';

interface SeoPage {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  index: boolean;
  article?: BlogArticle;
}

@Injectable()
export class BlogSeoService {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  readonly origin = blogOrigin();
  private readonly defaultTitle = 'Kupuassu | Contabilidade Inteligente';
  private readonly defaultDescription =
    'Kupuassu oferece serviços de contabilidade empresarial, consultoria tributária e soluções financeiras para empresas de todos os portes.';
  private readonly tags = new Set<string>();
  private canonical?: HTMLLinkElement;
  private structuredData?: HTMLScriptElement;

  constructor() {
    const destroy = inject(DestroyRef);
    destroy.onDestroy(() => {
      this.title.setTitle(this.defaultTitle);
      this.meta.updateTag({
        name: 'description',
        content: this.defaultDescription,
      });
      for (const tag of this.tags) this.meta.removeTag(tag);
      this.canonical?.parentNode?.removeChild(this.canonical);
      this.structuredData?.parentNode?.removeChild(this.structuredData);
    });
  }

  apply(page: SeoPage) {
    const url = this.origin + page.path;
    const image = this.origin + (page.image || '/blog-share.png');
    this.title.setTitle(page.title + ' | Kupuassu');
    this.meta.updateTag({ name: 'description', content: page.description });
    this.set('name', 'robots', page.index ? 'index,follow' : 'noindex,follow');
    this.set('property', 'og:site_name', 'Kupuassu');
    this.set('property', 'og:locale', 'pt_BR');
    this.set('property', 'og:type', page.article ? 'article' : 'website');
    this.set('property', 'og:title', page.title);
    this.set('property', 'og:description', page.description);
    this.set('property', 'og:url', url);
    this.set('property', 'og:image', image);
    this.set('property', 'og:image:alt', page.imageAlt || 'Kupuassu');
    this.set('name', 'twitter:card', 'summary_large_image');
    this.set('name', 'twitter:title', page.title);
    this.set('name', 'twitter:description', page.description);
    this.set('name', 'twitter:image', image);
    this.set('name', 'twitter:image:alt', page.imageAlt || 'Kupuassu');

    this.canonical ??=
      this.document.head.querySelector('link[rel=canonical]') ??
      this.document.createElement('link');
    this.canonical.rel = 'canonical';
    this.canonical.href = url;
    this.document.head.appendChild(this.canonical);
    const schema =
      this.structuredData ??
      this.document.head.querySelector('script[data-blog-schema]');
    schema?.parentNode?.removeChild(schema);
    if (page.article) {
      this.structuredData = this.document.createElement('script');
      this.structuredData.type = 'application/ld+json';
      this.structuredData.setAttribute('data-blog-schema', '');
      this.structuredData.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        mainEntityOfPage: url,
        headline: page.article.title,
        description: page.description,
        image: [image],
        author: {
          '@type':
            page.article.author === 'Equipe Kupuassu'
              ? 'Organization'
              : 'Person',
          name: page.article.author,
        },
        datePublished: page.article.publishedAt,
        dateModified: page.article.updatedAt,
      }).replace(/</g, '\\u003c');
      this.document.head.appendChild(this.structuredData);
    }
  }

  private set(attribute: 'name' | 'property', key: string, content: string) {
    this.tags.add(`${attribute}="${key}"`);
    this.meta.updateTag({ [attribute]: key, content });
  }
}
