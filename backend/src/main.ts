import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import * as express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import {
  ensureUploadDirectories,
  uploadsRoot,
} from './common/utils/upload.util';

function buildAllowedOrigins(frontendUrl: string, corsAllowedOrigins?: string) {
  const configuredOrigins = (corsAllowedOrigins || frontendUrl)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return Array.from(
    new Set([
      ...configuredOrigins,
      frontendUrl,
      'http://localhost:3000',
      'http://localhost:8080',
      'http://localhost:5173',
    ]),
  );
}

function buildRateLimitMessage(message: string) {
  return {
    statusCode: 429,
    message,
    error: 'Too Many Requests',
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: false,
  });

  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>(
    'FRONTEND_URL',
    'http://localhost:8080',
  );
  const corsAllowedOrigins = configService.get<string>(
    'CORS_ALLOWED_ORIGINS',
    frontendUrl,
  );
  const port = configService.get<number>('PORT', 3000);
  const trustProxy = configService.get<boolean>('TRUST_PROXY', false);
  const throttleTtl = configService.get<number>('THROTTLE_TTL', 60);
  const throttleLimit = configService.get<number>('THROTTLE_LIMIT', 120);
  const authThrottleTtl = configService.get<number>('AUTH_THROTTLE_TTL', 60);
  const authThrottleLimit = configService.get<number>(
    'AUTH_THROTTLE_LIMIT',
    10,
  );

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.disable('x-powered-by');

  if (trustProxy) {
    expressApp.set('trust proxy', 1);
  }

  ensureUploadDirectories();

  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
    }),
  );
  app.use(compression());
  app.use(
    rateLimit({
      windowMs: throttleTtl * 1000,
      max: throttleLimit,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (request) => request.path.startsWith('/uploads'),
      message: buildRateLimitMessage(
        'Too many requests, please try again in a moment.',
      ),
    }),
  );
  app.use(
    [
      '/auth/signin',
      '/auth/signup',
      '/auth/forgot-password',
      '/auth/reset-password',
    ],
    rateLimit({
      windowMs: authThrottleTtl * 1000,
      max: authThrottleLimit,
      standardHeaders: true,
      legacyHeaders: false,
      message: buildRateLimitMessage(
        'Too many authentication attempts, please try again later.',
      ),
    }),
  );
  app.use('/uploads', express.static(uploadsRoot));

  app.enableCors({
    origin: buildAllowedOrigins(frontendUrl, corsAllowedOrigins),
    credentials: true,
  });

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
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');
  Logger.log(`Application is running on: ${await app.getUrl()}`, 'Bootstrap');
}

void bootstrap();
