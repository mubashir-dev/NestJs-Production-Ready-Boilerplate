import { Global, Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { RedisService } from './redis.service';
import { SharedModule } from '@src/shared/shared.module';
import { ApiConfigService } from '@src/shared/services/api-config.service';

@Global()
@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [SharedModule],
      useFactory: async (configService: ApiConfigService) => ({
        type: 'single',
        url: configService.redisConfig.url,
        options: {
          password: configService.redisConfig.password,
        },
      }),
      inject: [ApiConfigService],
    }),
  ],
  providers: [RedisService],
  exports: [RedisModule, RedisService],
})
export class RedisCachingModule {}
