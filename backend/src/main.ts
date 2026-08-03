import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONT_BASE_URL,
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
    credentials: true,
  });

  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
