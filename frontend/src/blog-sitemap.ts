import { apiOrigin } from './blog-server-config';

interface SitemapPost {
  slug: string;
  updatedAt: string;
}

function xml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function blogSitemap(origin: string) {
  const response = await fetch(apiOrigin + '/api/blog/sitemap', {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('Falha ao carregar sitemap');
  const posts: SitemapPost[] = await response.json();
  const staticEntries = ['/', '/blog'].map(
    (path) => `<url><loc>${xml(origin + path)}</loc></url>`,
  );
  const postEntries = posts.map(({ slug, updatedAt }) => {
    const date = updatedAt.slice(0, 10);
    return `<url><loc>${xml(origin + '/blog/' + encodeURIComponent(slug))}</loc><lastmod>${xml(date)}</lastmod></url>`;
  });
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    [...staticEntries, ...postEntries].join('\n') +
    '\n</urlset>'
  );
}
