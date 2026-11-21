import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CreateBlog1770000000000 } from './blog/blog.migration';
import { BlogModule } from './blog/blog.module';
import { ContactModule } from './contact/contact.module';
import { UserModule } from './users/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get<string>('DATABASE_PATH', 'database.sqlite'),
        autoLoadEntities: true,
        synchronize: true,
        migrations: [CreateBlog1770000000000],
        migrationsRun: true,
      }),
    }),
    UserModule,
    AuthModule,
    ContactModule,
    BlogModule,
  ],
})
export class AppModule {}
