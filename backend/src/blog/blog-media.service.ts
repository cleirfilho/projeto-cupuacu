import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import {
  access,
  mkdir,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import sanitizeHtml = require('sanitize-html');
import sharp from 'sharp';
import { MEDIA_NAME, MEDIA_PATH } from './blog.dto';

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const formats: Record<string, { type: string; extensions: readonly string[] }> =
  {
    jpeg: { type: 'image/jpeg', extensions: ['.jpg', '.jpeg'] },
    png: { type: 'image/png', extensions: ['.png'] },
    webp: { type: 'image/webp', extensions: ['.webp'] },
  };

export interface BlogUpload {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export function sanitizeBlogContent(content: string) {
  return sanitizeHtml(content, {
    allowedTags: [
      'p',
      'br',
      'h2',
      'h3',
      'h4',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'blockquote',
      'ol',
      'ul',
      'li',
      'a',
      'img',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
    ],
    allowedAttributes: {
      a: ['href', 'rel'],
      img: ['src', 'alt', 'loading', 'decoding'],
      p: ['class'],
      h2: ['class'],
      h3: ['class'],
      h4: ['class'],
      blockquote: ['class'],
    },
    allowedClasses: {
      '*': ['ql-align-center', 'ql-align-right', 'ql-align-justify'],
    },
    allowedSchemes: ['http', 'https'],
    allowProtocolRelative: false,
    textFilter: (text) => text.replace(/\u00a0/g, ' '),
    transformTags: {
      a: (_tag, attrs) => ({
        tagName: 'a',
        attribs: { href: attrs.href ?? '', rel: 'noopener noreferrer' },
      }),
      img: (_tag, attrs): sanitizeHtml.Tag => ({
        tagName: 'img',
        attribs: MEDIA_PATH.test(attrs.src ?? '')
          ? {
              src: attrs.src,
              alt: (attrs.alt ?? '').slice(0, 200),
              loading: 'lazy',
              decoding: 'async',
            }
          : {},
      }),
    },
    exclusiveFilter: ({ tag, attribs }) => tag === 'img' && !attribs.src,
  });
}

@Injectable()
export class BlogMediaService {
  private readonly folder: string;

  constructor(config: ConfigService) {
    const database = config.get<string>('DATABASE_PATH', 'database.sqlite');
    this.folder = resolve(
      config.get<string>('BLOG_MEDIA_PATH', `${database}.blog-media`),
    );
  }

  async upload(file?: BlogUpload) {
    if (!file?.buffer.length || file.buffer.length > MAX_IMAGE_SIZE) {
      throw new BadRequestException('Selecione uma imagem de até 5 MB.');
    }
    let optimized: Buffer;
    let thumbnail: Buffer;
    try {
      const image = sharp(file.buffer, {
        limitInputPixels: 25_000_000,
        failOn: 'warning',
      });
      const metadata = await image.metadata();
      const format = formats[metadata.format ?? ''];
      if (
        !format ||
        format.type !== file.mimetype ||
        !format.extensions.includes(extname(file.originalname).toLowerCase()) ||
        (metadata.pages ?? 1) > 1
      ) {
        throw new Error('Formato inválido');
      }
      optimized = await image
        .rotate()
        .resize({
          width: 1600,
          height: 1600,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 82 })
        .toBuffer();
      thumbnail = await sharp(optimized)
        .resize({ width: 560, withoutEnlargement: true })
        .webp({ quality: 76 })
        .toBuffer();
    } catch {
      throw new BadRequestException(
        'Envie uma imagem JPG, PNG ou WebP estática e válida.',
      );
    }
    await mkdir(this.folder, { recursive: true });
    const name = `${randomUUID()}.webp`;
    const full = join(this.folder, name);
    const thumb = this.thumbnail(full);
    try {
      await writeFile(`${full}.tmp`, optimized, { flag: 'wx' });
      await writeFile(`${thumb}.tmp`, thumbnail, { flag: 'wx' });
      await rename(`${thumb}.tmp`, thumb);
      await rename(`${full}.tmp`, full);
    } catch (error) {
      await Promise.all(
        [full, thumb, `${full}.tmp`, `${thumb}.tmp`].map((path) =>
          rm(path, { force: true }),
        ),
      );
      throw error;
    }
    return { url: `/api/blog/media/${name}` };
  }

  private thumbnail(path: string) {
    return path.replace(/\.webp$/, '.thumb.webp');
  }

  async open(name: string, thumbnail: boolean) {
    if (!MEDIA_NAME.test(name)) throw new NotFoundException();
    const original = join(this.folder, name);
    const path = thumbnail ? this.thumbnail(original) : original;
    await access(path).catch(() => {
      throw new NotFoundException();
    });
    return createReadStream(path);
  }

  async validateReferences(paths: string[]) {
    for (const path of new Set(paths.filter(Boolean))) {
      if (!MEDIA_PATH.test(path))
        throw new BadRequestException('Imagem inválida.');
      await access(
        join(this.folder, path.slice('/api/blog/media/'.length)),
      ).catch(() => {
        throw new BadRequestException(
          'Imagem indisponível. Envie-a novamente.',
        );
      });
    }
  }

  async cleanup(isUsed: (url: string) => Promise<boolean>) {
    await mkdir(this.folder, { recursive: true });
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    for (const name of await readdir(this.folder)) {
      const original = name
        .replace(/\.tmp$/, '')
        .replace(/\.thumb\.webp$/, '.webp');
      if (!MEDIA_NAME.test(original)) continue;
      const path = join(this.folder, name);
      const info = await stat(path).catch(() => undefined);
      if (!info?.isFile() || info.mtimeMs >= cutoff) continue;
      if (
        name.endsWith('.tmp') ||
        !(await isUsed(`/api/blog/media/${original}`))
      ) {
        await rm(path, { force: true });
      }
    }
  }
}
