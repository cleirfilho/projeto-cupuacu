import { HTTP_TRANSFER_CACHE_ORIGIN_MAP } from '@angular/common/http';
import {
  mergeApplicationConfig,
  ApplicationConfig,
  inject,
  REQUEST,
} from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { apiOrigin, siteOrigin } from '../blog-server-config';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { BLOG_API_ORIGIN, BLOG_SITE_ORIGIN } from './site/blog/blog.service';

function requestOrigin() {
  return new URL(inject(REQUEST)?.url ?? 'http://localhost:4000').origin;
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: BLOG_API_ORIGIN, useValue: apiOrigin },
    {
      provide: BLOG_SITE_ORIGIN,
      useFactory: () => siteOrigin(requestOrigin()),
    },
    {
      provide: HTTP_TRANSFER_CACHE_ORIGIN_MAP,
      useFactory: () => ({ [apiOrigin]: requestOrigin() }),
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
