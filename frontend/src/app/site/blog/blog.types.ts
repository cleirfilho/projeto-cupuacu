export interface BlogTerm {
  id: number;
  name: string;
  slug: string;
}

export interface BlogCategory extends BlogTerm {
  description: string;
  active: boolean;
  displayOrder: number;
}

export interface BlogCard {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  featuredImageAlt: string;
  category: BlogTerm;
  author: string;
  publishedAt: string | null;
  updatedAt: string;
  isFeatured: boolean;
  isPinned: boolean;
  viewsCount: number;
}

export interface BlogArticle extends BlogCard {
  content: string;
  tags: BlogTerm[];
  allowIndexing: boolean;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
}

export interface BlogPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface BlogFilters {
  search?: string;
  category?: string;
  tag?: string;
  page?: number;
}

export interface BlogHeading {
  title: string;
  description: string;
}
