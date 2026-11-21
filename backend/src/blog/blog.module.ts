import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { BlogAdminController, BlogController } from './blog.controller';
import { BlogCategory, BlogPost, BlogSettings, BlogTag } from './blog.entities';
import { BlogMediaService } from './blog-media.service';
import { BlogService } from './blog.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BlogPost,
      BlogCategory,
      BlogTag,
      BlogSettings,
      User,
    ]),
  ],
  controllers: [BlogAdminController, BlogController],
  providers: [BlogService, BlogMediaService],
})
export class BlogModule {}
