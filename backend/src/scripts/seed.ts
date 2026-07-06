import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { seedDemoData } from '../common/seed/demo-seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const dataSource = app.get(DataSource);
    await seedDemoData(dataSource, { reset: process.argv.includes('--reset') });
  } finally {
    await app.close();
  }
}

void bootstrap();
