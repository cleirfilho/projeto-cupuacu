import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  BlogAdminListDto,
  BlogCategoryDto,
  BlogListDto,
  BlogPostDto,
  BlogPreviewDto,
  BlogSettingsDto,
  BlogTagDto,
  BlogTagQueryDto,
  UpdateBlogCategoryDto,
  UpdateBlogPostDto,
  UpdateBlogTagDto,
  MEDIA_NAME,
} from './blog.dto';
import { BlogStatus } from './blog.entities';
import {
  BlogMediaService,
  BlogUpload,
  MAX_IMAGE_SIZE,
  sanitizeBlogContent,
} from './blog-media.service';
import { BlogService } from './blog.service';

const MEDIA_SESSION_COOKIE = 'kupuassu_blog_preview';
const MEDIA_SESSION_PATH = '/api/blog/media';

@ApiTags('Blog público')
@Controller('blog')
export class BlogController {
  constructor(
    private readonly blog: BlogService,
    private readonly media: BlogMediaService,
  ) {}

  @Get('posts')
  list(@Query() query: BlogListDto) {
    return this.blog.list(query);
  }

  @Get('posts/featured')
  featured(@Query('context') context?: string) {
    return this.blog.featured(context === 'home');
  }

  @Get('posts/popular')
  popular() {
    return this.blog.popular();
  }

  @Get('posts/:slug')
  post(@Param('slug') slug: string) {
    return this.blog.publicPost(slug);
  }

  @Get('posts/:slug/related')
  related(@Param('slug') slug: string) {
    return this.blog.related(slug);
  }

  @Post('posts/:slug/view')
  @HttpCode(204)
  view(@Param('slug') slug: string, @Req() request: Request) {
    return this.blog.view(
      slug,
      request.ip ?? '',
      request.get('user-agent') ?? '',
    );
  }

  @Get('categories')
  categories() {
    return this.blog.listCategories(true);
  }

  @Get('tags')
  tags(@Query() query: BlogTagQueryDto) {
    return this.blog.listTags(query, true);
  }

  @Get('settings')
  async settings() {
    const { title, description } = await this.blog.getSettings();
    return { title, description };
  }

  @Get('sitemap')
  sitemap() {
    return this.blog.sitemap();
  }

  @Get('media/:name')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  async image(
    @Param('name') name: string,
    @Query('variant') variant: string | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!MEDIA_NAME.test(name)) throw new NotFoundException();
    const isPublic = await this.blog.isPublicMedia(
      `${MEDIA_SESSION_PATH}/${name}`,
    );
    const cookie = req.headers.cookie
      ?.split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(MEDIA_SESSION_COOKIE + '='))
      ?.slice(MEDIA_SESSION_COOKIE.length + 1);
    if (!isPublic && !(await this.blog.mediaSessionValid(cookie)))
      throw new NotFoundException();
    const file = await this.media.open(name, variant === 'thumb');
    res.set(
      'Cache-Control',
      isPublic ? 'public, max-age=300' : 'private, no-store',
    );
    return new StreamableFile(file, { type: 'image/webp' });
  }
}

@ApiTags('Administração do blog')
@ApiBearerAuth('access-token')
@Controller('admin/blog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class BlogAdminController {
  constructor(
    private readonly blog: BlogService,
    private readonly media: BlogMediaService,
  ) {}

  @Get('posts')
  list(@Query() query: BlogAdminListDto) {
    return this.blog.adminList(query);
  }

  @Get('authors')
  authors() {
    return this.blog.authors();
  }

  @Get('posts/:id')
  post(@Param('id', ParseIntPipe) id: number) {
    return this.blog.adminPost(id);
  }

  @Post('posts')
  create(
    @Body() dto: BlogPostDto,
    @Req() request: Request & { user: { id: number } },
  ) {
    return this.blog.create(dto, request.user.id);
  }

  @Patch('posts/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBlogPostDto,
  ) {
    return this.blog.update(id, dto);
  }

  @Delete('posts/:id')
  @HttpCode(204)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.blog.deletePost(id);
  }

  @Post('posts/:id/publish')
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.blog.update(id, { status: BlogStatus.Published });
  }

  @Post('posts/:id/archive')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.blog.update(id, { status: BlogStatus.Archived });
  }

  @Post('posts/:id/duplicate')
  duplicate(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: { id: number } },
  ) {
    return this.blog.duplicate(id, request.user.id);
  }

  @Post('preview')
  preview(@Body() dto: BlogPreviewDto) {
    return { content: sanitizeBlogContent(dto.content) };
  }

  @Post('media/session')
  @HttpCode(204)
  mediaSession(
    @Req() req: Request & { user: { id: number; expiresAt: number } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const maxAge = Math.min(
      this.blog.mediaSessionAge,
      req.user.expiresAt - Date.now(),
    );
    res.cookie(
      MEDIA_SESSION_COOKIE,
      this.blog.mediaSession(req.user.id, maxAge),
      {
        path: MEDIA_SESSION_PATH,
        httpOnly: true,
        sameSite: 'strict',
        secure: req.secure || this.blog.secureMediaSession,
        maxAge,
      },
    );
  }

  @Delete('media/session')
  @HttpCode(204)
  clearMediaSession(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.clearCookie(MEDIA_SESSION_COOKIE, {
      path: MEDIA_SESSION_PATH,
      httpOnly: true,
      sameSite: 'strict',
      secure: req.secure || this.blog.secureMediaSession,
    });
  }

  @Post('media')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image'],
      properties: { image: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: MAX_IMAGE_SIZE, files: 1, fields: 0, parts: 2 },
    }),
  )
  upload(@UploadedFile() image?: BlogUpload) {
    return this.media.upload(image);
  }

  @Get('categories')
  categories() {
    return this.blog.listCategories(false);
  }

  @Post('categories')
  createCategory(@Body() dto: BlogCategoryDto) {
    return this.blog.saveCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBlogCategoryDto,
  ) {
    return this.blog.saveCategory(dto, id);
  }

  @Delete('categories/:id')
  @HttpCode(204)
  deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.blog.deleteCategory(id);
  }

  @Get('tags')
  tags(@Query() query: BlogTagQueryDto) {
    return this.blog.listTags(query, false);
  }

  @Post('tags')
  createTag(@Body() dto: BlogTagDto) {
    return this.blog.saveTag(dto);
  }

  @Patch('tags/:id')
  updateTag(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBlogTagDto,
  ) {
    return this.blog.saveTag(dto, id);
  }

  @Delete('tags/:id')
  @HttpCode(204)
  deleteTag(@Param('id', ParseIntPipe) id: number) {
    return this.blog.deleteTag(id);
  }

  @Get('settings')
  settings() {
    return this.blog.getSettings();
  }

  @Patch('settings')
  updateSettings(@Body() dto: BlogSettingsDto) {
    return this.blog.updateSettings(dto);
  }

  @Get('dashboard')
  dashboard() {
    return this.blog.dashboard();
  }
}
