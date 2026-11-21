import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { BlogStatus } from './blog.entities';

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MEDIA_NAME = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\.webp$/;
export const MEDIA_PATH =
  /^\/api\/blog\/media\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\.webp$/;

const Optional = () => ValidateIf((_, value) => value !== undefined);
const Trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

export class BlogListDto {
  @ApiPropertyOptional()
  @Optional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  page = 1;

  @ApiPropertyOptional()
  @Optional()
  @Trim()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional()
  @Optional()
  @Matches(SLUG)
  @MaxLength(150)
  category?: string;

  @ApiPropertyOptional()
  @Optional()
  @Matches(SLUG)
  @MaxLength(150)
  tag?: string;
}

export enum BlogSort {
  Recent = 'recent',
  Oldest = 'oldest',
  Title = 'title',
  Popular = 'popular',
}

export class BlogAdminListDto extends BlogListDto {
  @ApiPropertyOptional({ enum: BlogStatus })
  @Optional()
  @IsEnum(BlogStatus)
  status?: BlogStatus;

  @ApiPropertyOptional()
  @Optional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  authorId?: number;

  @ApiPropertyOptional()
  @Optional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsISO8601({ strict: true })
  from?: string;

  @ApiPropertyOptional()
  @Optional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsISO8601({ strict: true })
  to?: string;

  @ApiPropertyOptional({ enum: BlogSort })
  @Optional()
  @IsEnum(BlogSort)
  sort?: BlogSort;

  @ApiPropertyOptional()
  @Optional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 15;
}

export class BlogTagDto {
  @ApiProperty()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional()
  @Optional()
  @Matches(SLUG)
  @MaxLength(150)
  slug?: string;
}

export class BlogCategoryDto extends BlogTagDto {
  @ApiPropertyOptional()
  @Optional()
  @Trim()
  @IsString()
  @MaxLength(400)
  description?: string;

  @ApiPropertyOptional()
  @Optional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @Optional()
  @IsInt()
  @Min(0)
  @Max(10000)
  displayOrder?: number;
}

export class UpdateBlogCategoryDto extends PartialType(BlogCategoryDto, {
  skipNullProperties: false,
}) {}
export class UpdateBlogTagDto extends PartialType(BlogTagDto, {
  skipNullProperties: false,
}) {}

export class BlogPostDto {
  @ApiProperty()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title: string;

  @ApiPropertyOptional()
  @Optional()
  @Matches(SLUG)
  @MaxLength(150)
  slug?: string;

  @ApiPropertyOptional()
  @Optional()
  @Trim()
  @IsString()
  @MaxLength(400)
  excerpt?: string;

  @ApiPropertyOptional()
  @Optional()
  @IsString()
  @MaxLength(220000)
  content?: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  categoryId: number;

  @ApiPropertyOptional({ type: [Number] })
  @Optional()
  @IsArray()
  @ArrayMaxSize(30)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  tagIds?: number[];

  @ApiPropertyOptional()
  @Optional()
  @Matches(/^$|^\/api\/blog\/media\/[0-9a-f-]{36}\.webp$/)
  featuredImage?: string;

  @ApiPropertyOptional()
  @Optional()
  @Trim()
  @IsString()
  @MaxLength(200)
  featuredImageAlt?: string;

  @ApiPropertyOptional({ enum: BlogStatus })
  @Optional()
  @IsEnum(BlogStatus)
  status?: BlogStatus;

  @ApiPropertyOptional()
  @Optional()
  @IsISO8601({ strict: true })
  @Matches(/T.+(?:Z|[+-]\d{2}:\d{2})$/)
  scheduledAt?: string;

  @ApiPropertyOptional()
  @Optional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @Optional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional()
  @Optional()
  @IsBoolean()
  allowIndexing?: boolean;

  @ApiPropertyOptional()
  @Optional()
  @Trim()
  @IsString()
  @MaxLength(70)
  metaTitle?: string;

  @ApiPropertyOptional()
  @Optional()
  @Trim()
  @IsString()
  @MaxLength(180)
  metaDescription?: string;

  @ApiPropertyOptional()
  @Optional()
  @Matches(/^$|^\/api\/blog\/media\/[0-9a-f-]{36}\.webp$/)
  ogImage?: string;
}

export class UpdateBlogPostDto extends PartialType(BlogPostDto, {
  skipNullProperties: false,
}) {}

export class BlogPreviewDto {
  @ApiProperty()
  @IsString()
  @MaxLength(220000)
  content: string;
}

export class BlogTagQueryDto {
  @ApiPropertyOptional()
  @Optional()
  @Trim()
  @IsString()
  @MaxLength(80)
  search?: string;

  @ApiPropertyOptional()
  @Optional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  page = 1;
}

export class BlogSettingsDto {
  @ApiPropertyOptional()
  @Optional()
  @IsInt()
  @Min(1)
  @Max(24)
  pageSize?: number;

  @ApiPropertyOptional()
  @Optional()
  @IsInt()
  @Min(1)
  @Max(8)
  homeCount?: number;

  @ApiPropertyOptional()
  @Optional()
  @IsInt()
  @Min(1)
  @Max(10)
  popularCount?: number;

  @ApiPropertyOptional()
  @Optional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional()
  @Optional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(180)
  description?: string;

  @ApiPropertyOptional()
  @Optional()
  @IsBoolean()
  homeEnabled?: boolean;
}
