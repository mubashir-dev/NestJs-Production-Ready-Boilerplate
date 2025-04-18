import {
  ClassSerializerInterceptor,
  HttpStatus,
  UnprocessableEntityException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ExpressAdapter } from '@nestjs/platform-express';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/bad-request.filter';
import { QueryFailedFilter } from './filters/query-failed.filter';
import { ResponseInterceptor } from './interceptors/response-interceptor';
import { setupSwagger } from './setup-swagger';
import { ApiConfigService } from './shared/services/api-config.service';
import { SharedModule } from './shared/shared.module';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';

export async function bootstrap(): Promise<NestExpressApplication> {
  //app initialization
  initializeTransactionalContext();
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
    { bufferLogs: true },
  );

  //logger
  app.useLogger(app.get(Logger));

  //configuration
  const configService = app.select(SharedModule).get(ApiConfigService);

  //cors
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.removeHeader('Cross-Origin-Opener-Policy');
    next();
  });

  const corsOptions: CorsOptions = {
    origin: '*',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  };
  app.enableCors(corsOptions);

  //middlewares
  app.use(helmet()); //TODO:need to uncomment this when we go to production
  app.use(morgan('combined'));
  app.enableVersioning({
    type: VersioningType.URI,
  });
  const reflector = app.get(Reflector);

  //filters
  app.useGlobalFilters(
    new HttpExceptionFilter(reflector),
    new QueryFailedFilter(reflector),
  );

  //interceptors
  app.useGlobalInterceptors(
    new ResponseInterceptor(configService),
    new ClassSerializerInterceptor(reflector),
    new LoggerErrorInterceptor(),
  );

  //pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      transform: true,
      dismissDefaultMessages: true,
      exceptionFactory: (errors) => new UnprocessableEntityException(errors),
    }),
  );

  //compression
  if (!configService.isDevelopment) {
    app.use(compression());
  }

  //graceful shutdown
  if (!configService.isDevelopment) {
    app.enableShutdownHooks();
  }

  //swagger
  if (configService.documentationEnabled) {
    setupSwagger(app);
  }

  await app.startAllMicroservices();
  const port = configService.appConfig.port;
  await app.listen(port);
  return app;
}

bootstrap();
