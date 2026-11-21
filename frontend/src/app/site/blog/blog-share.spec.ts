import { blogShareLinks } from './blog-share';

describe('Compartilhamento do blog', () => {
  it('codifica a URL canônica e o título em cada rede', () => {
    const canonical = 'https://example.test/blog/gestao?q=a&outro=b';
    const title = 'Gestão & Finanças';
    const [whatsapp, facebook, linkedin, x] = blogShareLinks(
      canonical,
      title,
    ).map((link) => new URL(link.url));
    expect(whatsapp.searchParams.get('text')).toBe(title + ' ' + canonical);
    expect(facebook.searchParams.get('u')).toBe(canonical);
    expect(linkedin.searchParams.get('url')).toBe(canonical);
    expect(x.searchParams.get('url')).toBe(canonical);
    expect(x.searchParams.get('text')).toBe(title);
  });
});
