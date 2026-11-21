import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum BlogStatus {
  Draft = 'RASCUNHO',
  Scheduled = 'AGENDADO',
  Published = 'PUBLICADO',
  Archived = 'ARQUIVADO',
}

abstract class BlogRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity({ name: 'blog_categories', synchronize: false })
export class BlogCategory extends BlogRecord {
  @Column({ unique: true, collation: 'NOCASE' })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ default: '' })
  description: string;

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;
}

@Entity({ name: 'blog_tags', synchronize: false })
export class BlogTag extends BlogRecord {
  @Column({ unique: true, collation: 'NOCASE' })
  name: string;

  @Column({ unique: true })
  slug: string;
}

@Entity({ name: 'blog_posts', synchronize: false })
@Index('blog_posts_publication', ['status', 'publishedAt'])
@Index('blog_posts_category', ['categoryId', 'status', 'publishedAt'])
@Index('blog_posts_schedule', ['status', 'scheduledAt'])
export class BlogPost extends BlogRecord {
  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ default: '' })
  excerpt: string;

  @Column({ type: 'text', default: '' })
  content: string;

  @Column({ name: 'featured_image', default: '' })
  featuredImage: string;

  @Column({ name: 'featured_image_alt', default: '' })
  featuredImageAlt: string;

  @Column({ name: 'category_id' })
  categoryId: number;

  @ManyToOne(() => BlogCategory, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: BlogCategory;

  @Column({ name: 'author_id', type: 'integer', nullable: true })
  authorId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'author_id' })
  author: User | null;

  @ManyToMany(() => BlogTag)
  @JoinTable({
    name: 'blog_post_tags',
    joinColumn: { name: 'post_id' },
    inverseJoinColumn: { name: 'tag_id' },
    synchronize: false,
  })
  tags: BlogTag[];

  @Column({ type: 'simple-enum', enum: BlogStatus, default: BlogStatus.Draft })
  status: BlogStatus;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'is_pinned', default: false })
  isPinned: boolean;

  @Column({ name: 'allow_indexing', default: true })
  allowIndexing: boolean;

  @Column({ name: 'meta_title', default: '' })
  metaTitle: string;

  @Column({ name: 'meta_description', default: '' })
  metaDescription: string;

  @Column({ name: 'og_image', default: '' })
  ogImage: string;

  @Column({ name: 'views_count', default: 0 })
  viewsCount: number;

  @Column({ name: 'published_at', type: 'datetime', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'scheduled_at', type: 'datetime', nullable: true })
  scheduledAt: Date | null;
}

@Entity({ name: 'blog_settings', synchronize: false })
export class BlogSettings {
  @Column({ primary: true })
  id: number;

  @Column({ name: 'page_size' })
  pageSize: number;

  @Column({ name: 'home_count' })
  homeCount: number;

  @Column({ name: 'popular_count' })
  popularCount: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ name: 'home_enabled' })
  homeEnabled: boolean;
}
