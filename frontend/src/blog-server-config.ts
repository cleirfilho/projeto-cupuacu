export const apiOrigin = new URL(
  process.env['BLOG_API_ORIGIN'] || 'http://127.0.0.1:3000',
).origin;

export function siteOrigin(requestUrl: string) {
  return new URL(process.env['BLOG_SITE_URL'] || requestUrl).origin;
}
