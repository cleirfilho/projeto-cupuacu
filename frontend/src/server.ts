import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { apiOrigin, siteOrigin } from './blog-server-config';
import { blogSitemap } from './blog-sitemap';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine({
  allowedHosts: [
    'localhost',
    '127.0.0.1',
    new URL(siteOrigin('http://localhost')).hostname,
  ],
});

const upstream = new URL(apiOrigin);
const apiRequest = upstream.protocol === 'https:' ? httpsRequest : httpRequest;

app.use('/api', (req, res) => {
  const forward = apiRequest(
    upstream,
    {
      path: req.originalUrl,
      method: req.method,
      headers: {
        ...req.headers,
        host: upstream.host,
        'x-forwarded-for': req.socket.remoteAddress,
        connection: 'close',
      },
      timeout: 15_000,
    },
    (response) => {
      res.writeHead(response.statusCode ?? 502, response.headers);
      response.pipe(res);
      response.on('error', () => res.destroy());
    },
  );
  forward.on('timeout', () => forward.destroy());
  forward.on('error', () => {
    if (res.headersSent) res.destroy();
    else res.sendStatus(502);
  });
  res.on('close', () => forward.destroy());
  req.pipe(forward);
});

app.get('/robots.txt', (req, res) => {
  const origin = siteOrigin(`${req.protocol}://${req.get('host')}`);
  res
    .type('text/plain')
    .send(`User-agent: *\nDisallow: /admin/\nSitemap: ${origin}/sitemap.xml\n`);
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const origin = siteOrigin(`${req.protocol}://${req.get('host')}`);
    const sitemap = await blogSitemap(origin);
    res.type('application/xml').send(sitemap);
  } catch {
    res.sendStatus(503);
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
