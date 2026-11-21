import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  Brackets,
  DataSource,
  In,
  QueryFailedError,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.entity';
import {
  BlogAdminListDto,
  BlogCategoryDto,
  BlogListDto,
  BlogPostDto,
  BlogSettingsDto,
  BlogSort,
  BlogTagDto,
  BlogTagQueryDto,
  UpdateBlogPostDto,
} from './blog.dto';
import {
  BlogCategory,
  BlogPost,
  BlogSettings,
  BlogStatus,
  BlogTag,
} from './blog.entities';
import { BlogMediaService, sanitizeBlogContent } from './blog-media.service';

const SQL_NOW = "strftime('%Y-%m-%d %H:%M:%f', 'now')";
const RESERVED_SLUGS = new Set(['featured', 'popular', 'sitemap']);

export function blogSlug(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 130)
    .replace(/-$/, '');
}

function like(value: string) {
  return '%' + value.replace(/[\\%_]/g, '\\$&') + '%';
}

function conflict(error: unknown): never {
  if (
    error instanceof QueryFailedError &&
    /UNIQUE constraint failed/.test(error.message)
  ) {
    throw new ConflictException(
      'Já existe um registro com este nome ou endereço.',
    );
  }
  throw error;
}

@Injectable()
export class BlogService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BlogService.name);
  private readonly viewSecret: string;
  private publishTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;
  private postWrites: Promise<unknown> = Promise.resolve();
  readonly mediaSessionAge = 15 * 60 * 1000;
  readonly secureMediaSession: boolean;

  constructor(
    @InjectRepository(BlogPost) private readonly posts: Repository<BlogPost>,
    @InjectRepository(BlogCategory)
    private readonly categories: Repository<BlogCategory>,
    @InjectRepository(BlogTag) private readonly tags: Repository<BlogTag>,
    @InjectRepository(BlogSettings)
    private readonly settings: Repository<BlogSettings>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly db: DataSource,
    private readonly media: BlogMediaService,
    config: ConfigService,
  ) {
    this.viewSecret =
      config.get('BLOG_VIEW_SECRET') ??
      config.get('JWT_SECRET', 'cupuacu-dev-blog');
    this.secureMediaSession =
      config.get<string>('BLOG_SITE_URL')?.startsWith('https://') ?? false;
  }

  onModuleInit() {
    const report = (error: unknown) => this.logger.error(error);
    this.publishTimer = setInterval(
      () => void this.promoteScheduled().catch(report),
      60_000,
    ).unref();
    this.cleanupTimer = setInterval(
      () => void this.cleanup().catch(report),
      86_400_000,
    ).unref();
    void this.cleanup().catch(report);
  }

  onModuleDestroy() {
    clearInterval(this.publishTimer);
    clearInterval(this.cleanupTimer);
  }

  private queuePostWrite<T>(action: () => Promise<T>) {
    const result = this.postWrites.then(action);
    this.postWrites = result.catch(() => undefined);
    return result;
  }

  private mentionsMedia(query: SelectQueryBuilder<BlogPost>, url: string) {
    return query.andWhere(
      new Brackets((where) =>
        where
          .where('post.featuredImage = :mediaUrl OR post.ogImage = :mediaUrl')
          .orWhere('instr(post.content, :imageAttribute) > 0'),
      ),
      { mediaUrl: url, imageAttribute: `<img src="${url}"` },
    );
  }

  private async cleanup() {
    await this.db.query(
      "DELETE FROM blog_post_views WHERE day < date('now', '-29 days')",
    );
    await this.queuePostWrite(() =>
      this.media.cleanup((url) =>
        this.mentionsMedia(
          this.posts.createQueryBuilder('post'),
          url,
        ).getExists(),
      ),
    );
  }

  isPublicMedia(url: string) {
    return this.mentionsMedia(this.publicQuery(), url).getExists();
  }

  private mediaSignature(payload: string) {
    return createHmac('sha256', this.viewSecret)
      .update('blog-media-preview:' + payload)
      .digest('hex');
  }

  mediaSession(userId: number, maxAge: number) {
    const payload = `${userId}.${Date.now() + maxAge}`;
    return payload + '.' + this.mediaSignature(payload);
  }

  mediaSessionValid(cookie?: string) {
    const match = /^(\d+)\.(\d+)\.([a-f0-9]{64})$/.exec(cookie ?? '');
    if (!match || Number(match[2]) <= Date.now()) return false;
    const expected = this.mediaSignature(`${match[1]}.${match[2]}`);
    if (!timingSafeEqual(Buffer.from(match[3]), Buffer.from(expected)))
      return false;
    return this.users.existsBy({
      id: Number(match[1]),
      ativo: true,
      role: Role.ADMIN,
    });
  }

  private async promoteScheduled() {
    await this.posts
      .createQueryBuilder()
      .update()
      .set({
        status: BlogStatus.Published,
        publishedAt: () => 'scheduled_at',
        scheduledAt: null,
        updatedAt: () => SQL_NOW,
      })
      .where(`status = :status AND scheduled_at <= ${SQL_NOW}`, {
        status: BlogStatus.Scheduled,
      })
      .execute();
  }

  private publicQuery() {
    return this.posts
      .createQueryBuilder('post')
      .innerJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.author', 'author')
      .where(
        `((post.status = :published AND post.publishedAt <= ${SQL_NOW})
        OR (post.status = :scheduled AND post.scheduledAt <= ${SQL_NOW}))`,
        {
          published: BlogStatus.Published,
          scheduled: BlogStatus.Scheduled,
        },
      )
      .andWhere('category.active = 1');
  }

  private effectiveDate = 'COALESCE(post.scheduledAt, post.publishedAt)';
  private listFields = [
    'post.id',
    'post.title',
    'post.slug',
    'post.excerpt',
    'post.featuredImage',
    'post.featuredImageAlt',
    'post.authorId',
    'post.status',
    'post.isFeatured',
    'post.isPinned',
    'post.publishedAt',
    'post.scheduledAt',
    'post.viewsCount',
    'post.updatedAt',
    'category.id',
    'category.name',
    'category.slug',
    'author.id',
    'author.nome',
    'author.nomeFantasia',
    'author.razaoSocial',
  ];

  private article(post: BlogPost) {
    return {
      ...this.card(post),
      content: post.content,
      allowIndexing: post.allowIndexing,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      ogImage: post.ogImage,
      tags: post.tags.map(({ id, name, slug }) => ({ id, name, slug })),
    };
  }

  private card(post: BlogPost) {
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      featuredImageAlt: post.featuredImageAlt,
      category: {
        id: post.category.id,
        name: post.category.name,
        slug: post.category.slug,
      },
      author: this.authorName(post.author),
      publishedAt:
        post.status === BlogStatus.Scheduled
          ? post.scheduledAt
          : post.publishedAt,
      updatedAt: post.updatedAt,
      isFeatured: post.isFeatured,
      isPinned: post.isPinned,
      viewsCount: post.viewsCount,
    };
  }

  private authorName(user?: Partial<User> | null) {
    return (
      user?.nome || user?.nomeFantasia || user?.razaoSocial || 'Equipe Kupuassu'
    );
  }

  private filter(
    query: SelectQueryBuilder<BlogPost>,
    dto: BlogListDto,
    includeContent: boolean,
  ) {
    if (dto.category)
      query.andWhere('category.slug = :category', { category: dto.category });
    if (dto.tag) {
      query.andWhere(
        `EXISTS (SELECT 1 FROM blog_post_tags pt
        JOIN blog_tags t ON t.id = pt.tag_id WHERE pt.post_id = post.id AND t.slug = :tag)`,
        { tag: dto.tag },
      );
    }
    if (dto.search) {
      query.andWhere(
        new Brackets((where) => {
          where
            .where("post.title LIKE :search ESCAPE '\\'")
            .orWhere("post.excerpt LIKE :search ESCAPE '\\'");
          if (includeContent)
            where.orWhere("post.content LIKE :search ESCAPE '\\'");
        }),
        { search: like(dto.search) },
      );
    }
    return query;
  }

  async list(dto: BlogListDto) {
    const settings = await this.getSettings();
    const query = this.filter(this.publicQuery(), dto, true)
      .select(this.listFields)
      .orderBy('post.isPinned', 'DESC')
      .addOrderBy(this.effectiveDate, 'DESC')
      .addOrderBy('post.id', 'DESC');
    const [posts, total] = await query
      .offset((dto.page - 1) * settings.pageSize)
      .limit(settings.pageSize)
      .getManyAndCount();
    return {
      items: posts.map((post) => this.card(post)),
      total,
      page: dto.page,
      pageSize: settings.pageSize,
    };
  }

  async featured(home: boolean) {
    const settings = await this.getSettings();
    if (home && !settings.homeEnabled) return [];
    const posts = await this.publicQuery()
      .select(this.listFields)
      .orderBy('post.isFeatured', 'DESC')
      .addOrderBy('post.isPinned', 'DESC')
      .addOrderBy(this.effectiveDate, 'DESC')
      .addOrderBy('post.id', 'DESC')
      .limit(home ? settings.homeCount : 1)
      .getMany();
    return posts.map((post) => this.card(post));
  }

  async popular() {
    const { popularCount } = await this.getSettings();
    const posts = await this.publicQuery()
      .select(this.listFields)
      .andWhere('post.viewsCount > 0')
      .orderBy('post.viewsCount', 'DESC')
      .addOrderBy(this.effectiveDate, 'DESC')
      .addOrderBy('post.id', 'DESC')
      .limit(popularCount)
      .getMany();
    return posts.map((post) => this.card(post));
  }

  async publicPost(slug: string) {
    const post = await this.publicQuery()
      .leftJoinAndSelect('post.tags', 'tag')
      .andWhere('post.slug = :slug', { slug })
      .getOne();
    if (!post) throw new NotFoundException('Publicação não encontrada.');
    return this.article(post);
  }

  async related(slug: string) {
    const post = await this.publicPost(slug);
    const tagIds = post.tags.map(({ id }) => id);
    const scoring = tagIds.length
      ? '(SELECT count(*) FROM blog_post_tags pt WHERE pt.post_id = post.id AND pt.tag_id IN (:...tagIds))'
      : '0';
    const query = this.publicQuery()
      .select(this.listFields)
      .addSelect(
        'CASE WHEN post.categoryId = :categoryId THEN 1 ELSE 0 END',
        'same_category',
      )
      .addSelect(scoring, 'shared_tags')
      .andWhere('post.id <> :id', { id: post.id })
      .andWhere(`(post.categoryId = :categoryId OR ${scoring} > 0)`, {
        categoryId: post.category.id,
      })
      .orderBy('same_category', 'DESC')
      .addOrderBy('shared_tags', 'DESC')
      .addOrderBy(this.effectiveDate, 'DESC')
      .addOrderBy('post.id', 'DESC')
      .limit(3);
    if (tagIds.length) query.setParameter('tagIds', tagIds);
    return (await query.getMany()).map((item) => this.card(item));
  }

  async sitemap() {
    return this.publicQuery()
      .andWhere('post.allowIndexing = 1')
      .select(['post.slug AS slug', 'post.updatedAt AS updatedAt'])
      .orderBy(this.effectiveDate, 'DESC')
      .limit(49998)
      .getRawMany<{ slug: string; updatedAt: string }>();
  }

  async view(slug: string, ip: string, agent: string) {
    if (!ip || !agent || /bot|crawler|spider|headless|preview/i.test(agent))
      return;
    const day = new Date().toISOString().slice(0, 10);
    const key = (value: string) =>
      createHmac('sha256', this.viewSecret)
        .update(`${day}:${value}`)
        .digest('hex');
    await this.db.query(
      `
      INSERT INTO blog_post_views(post_id, visitor_key, network_key, day)
      SELECT p.id, ?, ?, ? FROM blog_posts p JOIN blog_categories c ON c.id = p.category_id
      WHERE p.slug = ? AND c.active = 1
        AND ((p.status = 'PUBLICADO' AND p.published_at <= ${SQL_NOW})
          OR (p.status = 'AGENDADO' AND p.scheduled_at <= ${SQL_NOW}))
        AND (SELECT count(*) FROM blog_post_views WHERE network_key = ? AND day = ?) < 60
      ON CONFLICT(post_id, visitor_key, day) DO NOTHING
    `,
      [
        key(`visitor:${ip}:${agent.slice(0, 400)}`),
        key(`network:${ip}`),
        day,
        slug,
        key(`network:${ip}`),
        day,
      ],
    );
  }

  async adminList(dto: BlogAdminListDto) {
    await this.promoteScheduled();
    const query = this.filter(
      this.posts
        .createQueryBuilder('post')
        .innerJoinAndSelect('post.category', 'category')
        .leftJoinAndSelect('post.author', 'author'),
      dto,
      false,
    ).select(this.listFields);
    if (dto.status)
      query.andWhere('post.status = :status', { status: dto.status });
    if (dto.authorId)
      query.andWhere('post.authorId = :authorId', { authorId: dto.authorId });
    if (dto.from)
      query.andWhere('date(post.publishedAt) >= :from', { from: dto.from });
    if (dto.to) query.andWhere('date(post.publishedAt) <= :to', { to: dto.to });
    if (dto.sort === BlogSort.Title)
      query.orderBy('post.title COLLATE NOCASE', 'ASC');
    if (dto.sort === BlogSort.Popular) query.orderBy('post.viewsCount', 'DESC');
    query
      .addOrderBy(
        'post.updatedAt',
        dto.sort === BlogSort.Oldest ? 'ASC' : 'DESC',
      )
      .addOrderBy('post.id', 'DESC');
    const [posts, total] = await query
      .offset((dto.page - 1) * dto.limit)
      .limit(dto.limit)
      .getManyAndCount();
    return {
      items: posts.map((post) => ({
        ...this.card(post),
        authorId: post.authorId,
        status: post.status,
        publishedAt: post.publishedAt,
        scheduledAt: post.scheduledAt,
      })),
      total,
      page: dto.page,
      pageSize: dto.limit,
    };
  }

  async authors() {
    const rows = await this.users
      .createQueryBuilder('author')
      .select([
        'author.id',
        'author.nome',
        'author.nomeFantasia',
        'author.razaoSocial',
      ])
      .where('author.id IN (SELECT author_id FROM blog_posts)')
      .orderBy('author.id')
      .getMany();
    return rows.map((user) => ({ id: user.id, name: this.authorName(user) }));
  }

  private async findPost(id: number) {
    const post = await this.posts.findOne({
      where: { id },
      relations: { category: true, author: true, tags: true },
    });
    if (!post) throw new NotFoundException('Publicação não encontrada.');
    return post;
  }

  async adminPost(id: number) {
    await this.promoteScheduled();
    const post = await this.findPost(id);
    return {
      ...this.article(post),
      authorId: post.authorId,
      categoryId: post.categoryId,
      status: post.status,
      publishedAt: post.publishedAt,
      scheduledAt: post.scheduledAt,
      tagIds: post.tags.map(({ id: tagId }) => tagId),
    };
  }

  private async choosePostSlug(title: string, explicit?: string) {
    if (explicit) {
      if (RESERVED_SLUGS.has(explicit))
        throw new ConflictException('Este endereço é reservado.');
      return explicit;
    }
    const base = blogSlug(title) || 'publicacao';
    const slugs = await this.posts
      .createQueryBuilder('post')
      .select('post.slug')
      .where('post.slug = :base OR post.slug LIKE :suffix', {
        base,
        suffix: `${base}-%`,
      })
      .getMany();
    const taken = new Set([
      ...slugs.map((post) => post.slug),
      ...RESERVED_SLUGS,
    ]);
    let slug = base;
    for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
    return slug;
  }

  create(dto: BlogPostDto, authorId: number) {
    return this.queuePostWrite(async () => {
      const post = this.posts.create({ authorId, status: BlogStatus.Draft });
      await this.applyPost(post, {
        ...dto,
        slug: await this.choosePostSlug(dto.title, dto.slug),
      });
      return this.adminPost(post.id);
    });
  }

  update(id: number, dto: UpdateBlogPostDto) {
    return this.queuePostWrite(async () => {
      await this.promoteScheduled();
      const post = await this.findPost(id);
      if (dto.slug) await this.choosePostSlug(post.title, dto.slug);
      await this.applyPost(post, dto);
      return this.adminPost(id);
    });
  }

  private async applyPost(post: BlogPost, dto: UpdateBlogPostDto) {
    const { tagIds, scheduledAt, status, ...fields } = dto;
    if (fields.categoryId !== undefined) {
      const category = await this.categories.findOneBy({
        id: fields.categoryId,
      });
      if (!category) throw new BadRequestException('Categoria inválida.');
      post.category = category;
    }
    if (tagIds !== undefined) {
      post.tags = tagIds.length
        ? await this.tags.findBy({ id: In(tagIds) })
        : [];
      if (post.tags.length !== tagIds.length)
        throw new BadRequestException('Uma ou mais tags não existem.');
    }
    if (fields.content !== undefined)
      fields.content = sanitizeBlogContent(fields.content);
    Object.assign(post, fields);
    await this.media.validateReferences([
      post.featuredImage,
      post.ogImage,
      ...Array.from(
        (post.content ?? '').matchAll(/<img src="([^"]+)"/g),
        (match) => match[1],
      ),
    ]);
    if (post.featuredImage && !post.featuredImageAlt) {
      throw new BadRequestException(
        'Informe o texto alternativo da imagem principal.',
      );
    }
    const next = status ?? post.status;
    if (
      (next === BlogStatus.Scheduled || next === BlogStatus.Published) &&
      (!post.excerpt || !post.content?.replace(/<[^>]+>|&nbsp;/g, '').trim())
    ) {
      throw new BadRequestException(
        'Informe resumo e conteúdo para publicar ou agendar.',
      );
    }
    if (next === BlogStatus.Scheduled) {
      const date = scheduledAt ? new Date(scheduledAt) : post.scheduledAt;
      if (!date || date.getTime() <= Date.now())
        throw new BadRequestException('Informe uma data futura.');
      post.scheduledAt = date;
      post.publishedAt = null;
    } else {
      post.scheduledAt = null;
      if (next === BlogStatus.Published) post.publishedAt ??= new Date();
      if (next === BlogStatus.Draft) post.publishedAt = null;
    }
    post.status = next;
    // The database trigger owns the counter, including while the editor saves.
    delete (post as Partial<BlogPost>).viewsCount;
    await this.posts.save(post).catch(conflict);
  }

  async duplicate(id: number, authorId: number) {
    const post = await this.findPost(id);
    return this.create(
      {
        title: `${post.title.slice(0, 152)} (cópia)`,
        excerpt: post.excerpt,
        content: post.content,
        categoryId: post.categoryId,
        tagIds: post.tags.map((tag) => tag.id),
        featuredImage: post.featuredImage,
        featuredImageAlt: post.featuredImageAlt,
        ogImage: post.ogImage,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        allowIndexing: post.allowIndexing,
      },
      authorId,
    );
  }

  deletePost(id: number) {
    return this.queuePostWrite(async () => {
      if (!(await this.posts.delete(id)).affected)
        throw new NotFoundException('Publicação não encontrada.');
    });
  }

  listCategories(publicOnly: boolean) {
    return this.categories.find({
      where: publicOnly ? { active: true } : {},
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
  }

  async saveCategory(dto: Partial<BlogCategoryDto>, id?: number) {
    const category =
      id === undefined
        ? this.categories.create()
        : await this.categories.findOneBy({ id });
    if (!category) throw new NotFoundException('Categoria não encontrada.');
    Object.assign(category, dto);
    category.slug ||= blogSlug(category.name);
    if (!category.slug)
      throw new BadRequestException('Informe um endereço amigável válido.');
    return this.categories.save(category).catch(conflict);
  }

  async deleteCategory(id: number) {
    try {
      if (!(await this.categories.delete(id)).affected)
        throw new NotFoundException('Categoria não encontrada.');
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        /FOREIGN KEY constraint failed/.test(error.message)
      ) {
        throw new ConflictException(
          'Mova as publicações vinculadas antes de excluir a categoria.',
        );
      }
      throw error;
    }
  }

  async listTags(dto: BlogTagQueryDto, publicOnly: boolean) {
    const query = this.tags
      .createQueryBuilder('tag')
      .orderBy('tag.name', 'ASC')
      .addOrderBy('tag.id', 'ASC');
    if (dto.search)
      query.andWhere("tag.name LIKE :search ESCAPE '\\'", {
        search: like(dto.search),
      });
    if (publicOnly) {
      query.andWhere(`EXISTS (SELECT 1 FROM blog_post_tags pt
        JOIN blog_posts p ON pt.post_id = p.id JOIN blog_categories c ON c.id = p.category_id
        WHERE pt.tag_id = tag.id AND c.active = 1 AND (
          (p.status = 'PUBLICADO' AND p.published_at <= ${SQL_NOW})
          OR (p.status = 'AGENDADO' AND p.scheduled_at <= ${SQL_NOW})))`);
    }
    const pageSize = 30;
    const [items, total] = await query
      .offset((dto.page - 1) * pageSize)
      .limit(pageSize)
      .getManyAndCount();
    return { items, total, page: dto.page, pageSize };
  }

  async saveTag(dto: Partial<BlogTagDto>, id?: number) {
    const tag =
      id === undefined ? this.tags.create() : await this.tags.findOneBy({ id });
    if (!tag) throw new NotFoundException('Tag não encontrada.');
    Object.assign(tag, dto);
    tag.slug ||= blogSlug(tag.name);
    if (!tag.slug)
      throw new BadRequestException('Informe um endereço amigável válido.');
    return this.tags.save(tag).catch(conflict);
  }

  async deleteTag(id: number) {
    if (!(await this.tags.delete(id)).affected)
      throw new NotFoundException('Tag não encontrada.');
  }

  getSettings() {
    return this.settings.findOneByOrFail({ id: 1 });
  }

  async updateSettings(dto: BlogSettingsDto) {
    if (Object.keys(dto).length) await this.settings.update(1, dto);
    return this.getSettings();
  }

  async dashboard() {
    await this.promoteScheduled();
    const counts = await this.posts
      .createQueryBuilder('post')
      .select('post.status', 'status')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(post.viewsCount)', 'views')
      .groupBy('post.status')
      .getRawMany<{ status: BlogStatus; total: number; views: number }>();
    const days: { day: string; views: number }[] = await this.db.query(
      "SELECT day, COUNT(*) AS views FROM blog_post_views WHERE day >= date('now', '-29 days') GROUP BY day ORDER BY day",
    );
    return {
      total: counts.reduce((total, row) => total + row.total, 0),
      views: counts.reduce((total, row) => total + row.views, 0),
      statuses: Object.fromEntries(
        counts.map((row) => [row.status, row.total]),
      ),
      days,
      popular: await this.popular(),
      recent: (await this.adminList({ page: 1, limit: 5 })).items,
    };
  }
}
