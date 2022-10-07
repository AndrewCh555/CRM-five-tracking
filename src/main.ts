import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@shared/pipes';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import { contentParser } from 'fastify-multer';
import { setup } from './setup';
import { appConfig } from '@shared/configs/app.config';
import * as cookieParser from 'cookie-parser';
import fastifyCookie from '@fastify/cookie';
import { AllExceptionsFilter } from '@shared/exeption-filters/all-exeptions.filter';
import { cookieConfig } from '@shared/configs';

const port = appConfig.getPort();
const host = appConfig.getHost();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await app.register(fastifyCookie, cookieConfig);
  app.use(cookieParser());
  setup(app);
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
        scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
      },
    },
  });
  await app.register(contentParser);
  const config = new DocumentBuilder()
    .setTitle('BACKEND')
    .setDescription('REST API')
    .setVersion('1.0.0')
    .addTag('Time Tracking')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/docs', app, document);

  app.useGlobalPipes(new ValidationPipe());

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(port, host, () => console.log(`Server started on port = ${port}`));
}

bootstrap();
