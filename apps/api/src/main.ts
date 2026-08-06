import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    rawBody: true, // Required for Meta X-Hub-Signature-256 HMAC validation
  });

  const logger = new Logger('Bootstrap');

  // Security
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API Prefix
  const apiPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['docs', 'documentation', 'guide', 'health'],
  });

  // Swagger Documentation Setup (always active)
  const config = new DocumentBuilder()
    .setTitle('Kaizech Brain API')
    .setDescription('Multi-tenant Enterprise AI Agent Platform — API Specification & Integration Guide')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  logger.log(`📚 Swagger OpenAPI docs available at /docs and /${apiPrefix}/docs`);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🧠 Kaizech Brain API running on port ${port}`);
  logger.log(`📚 API prefix: /${apiPrefix}`);
}

bootstrap();
