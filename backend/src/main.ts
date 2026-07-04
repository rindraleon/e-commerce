import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:8080',
      'http://localhost:5173', // ajout Vite dev
    ],
    credentials: true,
  } });

  // Use global validation pipe with more permissive configuration
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,  // Allow extra properties during transformation
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,  // Automatically convert string numbers to numbers
    },
  }));

  await app.listen(process.env.PORT || 3000);

  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();