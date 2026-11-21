import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, type NextFunction, type Request, type Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  const parseBlogJson = json({ limit: '1mb' });
  app.use(
    '/api/admin/blog',
    (req: Request, res: Response, next: NextFunction) =>
      parseBlogJson(req, res, next),
  );
  const proxyHops = Number(process.env.BLOG_TRUST_PROXY_HOPS ?? 0);
  if (Number.isSafeInteger(proxyHops) && proxyHops > 0)
    app.set('trust proxy', proxyHops);

  app.enableCors({
    origin:
      process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()) ??
      true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (process.env.SWAGGER_ENABLED !== 'false') {
    const swaggerPath = process.env.SWAGGER_PATH ?? 'docs';
    const config = new DocumentBuilder()
      .setTitle('Kupuassu API')
      .setDescription('API de gestão para empresa de contabilidade')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Informe o access token obtido em POST /api/auth/login',
        },
        'access-token',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup(swaggerPath, app, document, {
      useGlobalPrefix: true,
      jsonDocumentUrl: `${swaggerPath}-json`,
      customSiteTitle: 'Kupuassu API',
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

void bootstrap();
