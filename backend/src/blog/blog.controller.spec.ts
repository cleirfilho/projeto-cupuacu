import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdtemp, rm } from 'node:fs/promises';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Role } from '../common/enums/role.enum';
import { TipoPessoa } from '../common/enums/tipo-pessoa.enum';
import { UserService } from '../users/user.service';

describe('Blog HTTP e migration SQLite', () => {
  let app: INestApplication;
  let folder: string;
  let db: DataSource;
  let administrator: string;
  let user: string;
  let category: number;
  let server: ReturnType<typeof request>;
  const env = { ...process.env };

  beforeAll(async () => {
    folder = await mkdtemp(join(tmpdir(), 'cupuacu-blog-'));
    process.env.DATABASE_PATH = join(folder, 'test.sqlite');
    process.env.BLOG_MEDIA_PATH = join(folder, 'media');
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    db = module.get(DataSource);
    server = request(app.getHttpServer() as Server);

    const users = module.get(UserService);
    await users.create({
      tipoPessoa: TipoPessoa.FISICA,
      nome: 'Leitor',
      email: 'reader@example.test',
      role: Role.USUARIO,
      senha: 'Reader@12345',
    });
    const login = async (email: string, senha: string) =>
      (await server.post('/api/auth/login').send({ email, senha }).expect(201))
        .body.accessToken as string;
    administrator = await login('admin@cupuacu.local', 'Admin@123');
    user = await login('reader@example.test', 'Reader@12345');
    const result = await server
      .post('/api/admin/blog/categories')
      .auth(administrator, { type: 'bearer' })
      .send({ name: 'Gestão' })
      .expect(201);
    category = result.body.id;
  });

  afterAll(async () => {
    await app?.close();
    if (folder) await rm(folder, { recursive: true, force: true });
    for (const key of Object.keys(process.env)) {
      if (!(key in env)) delete process.env[key];
    }
    Object.assign(process.env, env);
  });

  async function createPost(
    title: string,
    fields: Record<string, unknown> = {},
  ) {
    const response = await server
      .post('/api/admin/blog/posts')
      .auth(administrator, { type: 'bearer' })
      .send({
        title,
        categoryId: category,
        excerpt: 'Resumo editorial',
        content: '<p>Artigo de teste.</p>',
        ...fields,
      })
      .expect(201);
    return response.body as {
      id: number;
      slug: string;
      title: string;
      content: string;
    };
  }

  it('exige autenticação e papel ADMIN e aplica a migration real', async () => {
    await server.get('/api/admin/blog/posts').expect(401);
    await server
      .get('/api/admin/blog/dashboard')
      .auth(user, { type: 'bearer' })
      .expect(403);
    await server
      .post('/api/admin/blog/media')
      .auth(user, { type: 'bearer' })
      .expect(403);
    expect(await db.showMigrations()).toBe(false);
    expect(
      (await server.get('/api/blog/settings').expect(200)).body.title,
    ).toBe('Novidades e Conteúdos');
  });

  it('cria, edita, duplica, publica, arquiva e exclui com slugs únicos e rascunhos privados', async () => {
    const draft = await createPost('Gestão & Finanças');
    expect(draft.slug).toBe('gestao-financas');
    const second = await createPost('Gestão & Finanças');
    expect(second.slug).toBe('gestao-financas-2');
    await server
      .patch('/api/admin/blog/posts/' + second.id)
      .auth(administrator, { type: 'bearer' })
      .send({ slug: draft.slug })
      .expect(409);
    await server.get('/api/blog/posts/' + draft.slug).expect(404);
    await server
      .post('/api/blog/posts/' + draft.slug + '/view')
      .set('User-Agent', 'Browser de teste')
      .expect(204);

    const updated = await server
      .patch('/api/admin/blog/posts/' + draft.id)
      .auth(administrator, { type: 'bearer' })
      .send({ excerpt: 'Resumo atualizado' })
      .expect(200);
    expect(updated.body.excerpt).toBe('Resumo atualizado');
    expect(updated.body.viewsCount).toBe(0);

    const copy = await server
      .post('/api/admin/blog/posts/' + draft.id + '/duplicate')
      .auth(administrator, { type: 'bearer' })
      .expect(201);
    expect(copy.body.status).toBe('RASCUNHO');
    expect(copy.body.slug).not.toBe(draft.slug);
    await server
      .post('/api/admin/blog/posts/' + draft.id + '/publish')
      .auth(administrator, { type: 'bearer' })
      .expect(201);
    const publicPost = await server
      .get('/api/blog/posts/' + draft.slug)
      .expect(200);
    expect(publicPost.body).toMatchObject({
      title: draft.title,
      author: 'Administrador',
    });
    expect(JSON.stringify(publicPost.body)).not.toContain('@cupuacu.local');

    await server
      .post('/api/admin/blog/posts/' + draft.id + '/archive')
      .auth(administrator, { type: 'bearer' })
      .expect(201);
    await server.get('/api/blog/posts/' + draft.slug).expect(404);
    await server
      .delete('/api/admin/blog/posts/' + draft.id)
      .auth(administrator, { type: 'bearer' })
      .expect(204);
    await server
      .get('/api/admin/blog/posts/' + draft.id)
      .auth(administrator, { type: 'bearer' })
      .expect(404);
  });

  it('permite editar categorias e tags, protege vínculos e libera a remoção de tags', async () => {
    const cat = (
      await server
        .post('/api/admin/blog/categories')
        .auth(administrator, { type: 'bearer' })
        .send({ name: 'Tributos', displayOrder: 10 })
        .expect(201)
    ).body;
    const tag = (
      await server
        .post('/api/admin/blog/tags')
        .auth(administrator, { type: 'bearer' })
        .send({ name: 'Calendário' })
        .expect(201)
    ).body;
    await server
      .post('/api/admin/blog/tags')
      .auth(administrator, { type: 'bearer' })
      .send({ name: 'Calendario' })
      .expect(409);
    await server
      .patch('/api/admin/blog/tags/' + tag.id)
      .auth(administrator, { type: 'bearer' })
      .send({ name: 'Calendário Fiscal' })
      .expect(200);
    expect(
      (
        await server
          .get('/api/admin/blog/tags?search=Fiscal')
          .auth(administrator, { type: 'bearer' })
          .expect(200)
      ).body.items,
    ).toHaveLength(1);
    const article = await createPost('Calendário tributário', {
      categoryId: cat.id,
      tagIds: [tag.id],
      status: 'PUBLICADO',
    });
    const related = await createPost('Outros prazos', {
      tagIds: [tag.id],
      status: 'PUBLICADO',
    });
    expect(
      (
        await server
          .get('/api/blog/posts/' + article.slug + '/related')
          .expect(200)
      ).body.map((post: { id: number }) => post.id),
    ).toEqual([related.id]);
    await server
      .delete('/api/admin/blog/categories/' + cat.id)
      .auth(administrator, { type: 'bearer' })
      .expect(409);
    await server
      .patch('/api/admin/blog/categories/' + cat.id)
      .auth(administrator, { type: 'bearer' })
      .send({ active: false, displayOrder: 3, description: 'Assuntos fiscais' })
      .expect(200);
    await server.get('/api/blog/posts/' + article.slug).expect(404);
    await server
      .delete('/api/admin/blog/tags/' + tag.id)
      .auth(administrator, { type: 'bearer' })
      .expect(204);
    expect(
      (
        await server
          .get('/api/admin/blog/posts/' + article.id)
          .auth(administrator, { type: 'bearer' })
          .expect(200)
      ).body.tags,
    ).toEqual([]);
    await server
      .delete('/api/admin/blog/posts/' + article.id)
      .auth(administrator, { type: 'bearer' })
      .expect(204);
    await server
      .delete('/api/admin/blog/categories/' + cat.id)
      .auth(administrator, { type: 'bearer' })
      .expect(204);
  });

  it('publica após o horário agendado e inclui no sitemap somente itens indexáveis', async () => {
    const article = await createPost('Publicação agendada', {
      status: 'AGENDADO',
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
    await server.get('/api/blog/posts/' + article.slug).expect(404);
    expect(
      (await server.get('/api/blog/sitemap').expect(200)).body,
    ).not.toContainEqual(expect.objectContaining({ slug: article.slug }));
    await db.query(
      "UPDATE blog_posts SET scheduled_at = datetime('now', '-2 seconds') WHERE id = ?",
      [article.id],
    );
    await server.get('/api/blog/posts/' + article.slug).expect(200);
    expect(
      (
        await server
          .get('/api/admin/blog/posts/' + article.id)
          .auth(administrator, { type: 'bearer' })
          .expect(200)
      ).body.status,
    ).toBe('PUBLICADO');
    expect(
      (await server.get('/api/blog/sitemap').expect(200)).body,
    ).toContainEqual(expect.objectContaining({ slug: article.slug }));
    await server
      .patch('/api/admin/blog/posts/' + article.id)
      .auth(administrator, { type: 'bearer' })
      .send({ allowIndexing: false })
      .expect(200);
    await server.get('/api/blog/posts/' + article.slug).expect(200);
    expect(
      (await server.get('/api/blog/sitemap').expect(200)).body,
    ).not.toContainEqual(expect.objectContaining({ slug: article.slug }));
  });

  it('valida arquivos, reencoda imagens e sanitiza o HTML também na prévia privada', async () => {
    const png = await sharp({
      create: { width: 12, height: 12, channels: 3, background: 'white' },
    })
      .png()
      .toBuffer();
    await server
      .post('/api/admin/blog/media')
      .auth(administrator, { type: 'bearer' })
      .attach('image', Buffer.from('imagem inválida'), {
        filename: 'foto.png',
        contentType: 'image/png',
      })
      .expect(400);
    await server
      .post('/api/admin/blog/media')
      .auth(administrator, { type: 'bearer' })
      .attach('image', png, { filename: 'foto.txt', contentType: 'image/png' })
      .expect(400);
    const uploaded: { url: string } = (
      await server
        .post('/api/admin/blog/media')
        .auth(administrator, { type: 'bearer' })
        .attach('image', png, {
          filename: 'foto.png',
          contentType: 'image/png',
        })
        .expect(201)
    ).body;
    await server.get(uploaded.url).expect(404);
    const session = await server
      .post('/api/admin/blog/media/session')
      .auth(administrator, { type: 'bearer' })
      .expect(204);
    const cookies: unknown = session.headers['set-cookie'];
    const cookie = (
      Array.isArray(cookies) ? String(cookies[0]) : String(cookies)
    ).split(';')[0];
    await server
      .get(uploaded.url)
      .set('Cookie', cookie)
      .expect('Cache-Control', 'private, no-store')
      .expect('Content-Type', /image\/webp/)
      .expect(200);

    const content =
      '<h2>Conteúdo</h2><script type="text/plain">remover</script>' +
      '<p class="ql-align-center outra" data-editor="xyz">texto</p>' +
      `<img src="${uploaded.url}" alt="Descrição" /><img src="https://example.test/external.png">`;
    const preview = await server
      .post('/api/admin/blog/preview')
      .auth(administrator, { type: 'bearer' })
      .send({ content })
      .expect(201);
    const article = await createPost('Com imagem', {
      content,
      featuredImage: uploaded.url,
      featuredImageAlt: 'Descrição',
      status: 'PUBLICADO',
    });
    expect(article.content).toBe(preview.body.content);
    await server.get(uploaded.url).expect(200);
    await server.get(uploaded.url).query({ variant: 'thumb' }).expect(200);
    await server
      .post('/api/admin/blog/posts/' + article.id + '/archive')
      .auth(administrator, { type: 'bearer' })
      .expect(201);
    await server.get(uploaded.url).expect(404);
    expect(article.content).toContain('class="ql-align-center"');
    expect(article.content).toContain(uploaded.url);
    expect(article.content).not.toMatch(
      /script|remover|data-editor|external.png|outra/,
    );
  });

  it('pagina a busca, respeita destaque e fixação e classifica acessos reais sem duplicar', async () => {
    await server
      .patch('/api/admin/blog/settings')
      .auth(administrator, { type: 'bearer' })
      .send({ pageSize: 1, homeCount: 2 })
      .expect(200);
    const pinned = await createPost('Ordenação: fixada', {
      status: 'PUBLICADO',
      isPinned: true,
      content: '<p>palavra de busca</p>',
    });
    const featured = await createPost('Ordenação: destaque', {
      status: 'PUBLICADO',
      isFeatured: true,
      content: '<p>palavra de busca</p>',
    });
    const first = await server
      .get('/api/blog/posts')
      .query({ search: 'palavra de busca' })
      .expect(200);
    expect(first.body).toMatchObject({
      total: 2,
      page: 1,
      pageSize: 1,
      items: [expect.objectContaining({ id: pinned.id })],
    });
    const second = await server
      .get('/api/blog/posts')
      .query({ search: 'palavra de busca', page: 2 })
      .expect(200);
    expect(second.body.items).toEqual([
      expect.objectContaining({ id: featured.id }),
    ]);
    expect(
      (await server.get('/api/blog/posts/featured?context=home').expect(200))
        .body[0].id,
    ).toBe(featured.id);
    await server
      .get('/api/admin/blog/posts?sort=title')
      .auth(administrator, { type: 'bearer' })
      .expect(200);
    const view = (slug: string, agent: string) =>
      server
        .post('/api/blog/posts/' + slug + '/view')
        .set('User-Agent', agent)
        .expect(204);
    await Promise.all([
      view(featured.slug, 'Navegador A'),
      view(featured.slug, 'Navegador A'),
    ]);
    await view(featured.slug, 'Navegador B');
    await view(pinned.slug, 'Navegador A');
    await view(pinned.slug, 'ExemploBot');
    const popular = (await server.get('/api/blog/posts/popular').expect(200))
      .body;
    expect(popular.slice(0, 2)).toEqual([
      expect.objectContaining({ id: featured.id, viewsCount: 2 }),
      expect.objectContaining({ id: pinned.id, viewsCount: 1 }),
    ]);
    const dashboard = (
      await server
        .get('/api/admin/blog/dashboard')
        .auth(administrator, { type: 'bearer' })
        .expect(200)
    ).body;
    expect(dashboard.views).toBe(3);
    expect(dashboard.days[0].views).toBe(3);
    await server
      .patch('/api/admin/blog/settings')
      .auth(administrator, { type: 'bearer' })
      .send({ homeEnabled: false })
      .expect(200);
    expect(
      (await server.get('/api/blog/posts/featured?context=home').expect(200))
        .body,
    ).toEqual([]);
  });
});
