import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBlog1770000000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE blog_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR COLLATE NOCASE NOT NULL UNIQUE,
        slug VARCHAR NOT NULL UNIQUE, description VARCHAR NOT NULL DEFAULT '',
        active BOOLEAN NOT NULL DEFAULT 1, display_order INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await runner.query(`
      CREATE TABLE blog_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR COLLATE NOCASE NOT NULL UNIQUE,
        slug VARCHAR NOT NULL UNIQUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await runner.query(`
      CREATE TABLE blog_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT, title VARCHAR NOT NULL, slug VARCHAR NOT NULL UNIQUE,
        excerpt VARCHAR NOT NULL DEFAULT '', content TEXT NOT NULL DEFAULT '',
        featured_image VARCHAR NOT NULL DEFAULT '', featured_image_alt VARCHAR NOT NULL DEFAULT '',
        category_id INTEGER NOT NULL REFERENCES blog_categories(id) ON DELETE RESTRICT,
        author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR NOT NULL DEFAULT 'RASCUNHO'
          CHECK (status IN ('RASCUNHO', 'AGENDADO', 'PUBLICADO', 'ARQUIVADO')),
        is_featured BOOLEAN NOT NULL DEFAULT 0, is_pinned BOOLEAN NOT NULL DEFAULT 0,
        allow_indexing BOOLEAN NOT NULL DEFAULT 1, meta_title VARCHAR NOT NULL DEFAULT '',
        meta_description VARCHAR NOT NULL DEFAULT '', og_image VARCHAR NOT NULL DEFAULT '',
        views_count INTEGER NOT NULL DEFAULT 0, published_at DATETIME, scheduled_at DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await runner.query(
      'CREATE INDEX blog_posts_publication ON blog_posts(status, published_at)',
    );
    await runner.query(
      'CREATE INDEX blog_posts_category ON blog_posts(category_id, status, published_at)',
    );
    await runner.query(
      'CREATE INDEX blog_posts_schedule ON blog_posts(status, scheduled_at)',
    );
    await runner.query(`
      CREATE TABLE blog_post_tags (
        post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, tag_id)
      )
    `);
    await runner.query(
      'CREATE INDEX blog_post_tags_tag ON blog_post_tags(tag_id)',
    );
    await runner.query(`
      CREATE TABLE blog_post_views (
        post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
        visitor_key VARCHAR NOT NULL, network_key VARCHAR NOT NULL, day VARCHAR NOT NULL,
        viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (post_id, visitor_key, day)
      )
    `);
    await runner.query(
      'CREATE INDEX blog_views_network ON blog_post_views(network_key, day)',
    );
    await runner.query('CREATE INDEX blog_views_day ON blog_post_views(day)');
    await runner.query(`
      CREATE TRIGGER blog_increment_views AFTER INSERT ON blog_post_views
      BEGIN
        UPDATE blog_posts SET views_count = views_count + 1 WHERE id = NEW.post_id;
      END
    `);
    await runner.query(`
      CREATE TABLE blog_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1), page_size INTEGER NOT NULL, home_count INTEGER NOT NULL,
        popular_count INTEGER NOT NULL, title VARCHAR NOT NULL, description VARCHAR NOT NULL,
        home_enabled BOOLEAN NOT NULL
      )
    `);
    await runner.query(`
      INSERT INTO blog_settings VALUES (
        1, 9, 3, 5, 'Novidades e Conteúdos',
        'Acompanhe nossas novidades, informações e conteúdos especiais.', 1
      )
    `);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TRIGGER blog_increment_views');
    for (const table of [
      'blog_settings',
      'blog_post_views',
      'blog_post_tags',
      'blog_posts',
      'blog_tags',
      'blog_categories',
    ]) {
      await runner.query(`DROP TABLE ${table}`);
    }
  }
}
