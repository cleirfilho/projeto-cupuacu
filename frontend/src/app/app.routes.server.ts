import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Prerender },
  {
    path: 'blog',
    renderMode: RenderMode.Server,
    headers: { 'Cache-Control': 'no-cache' },
  },
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Server,
    headers: { 'Cache-Control': 'no-cache' },
  },
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client },
];
