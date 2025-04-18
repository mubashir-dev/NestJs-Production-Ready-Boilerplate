import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { RedisTTL } from '@src/common/enum/redis-ttl.enum';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redisClient: Redis) {}

  async setValue(key: string, value: string, ttl: RedisTTL): Promise<void> {
    await this.redisClient.set(key, value, 'EX', ttl);
  }

  async getValue(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async setValueWithCustomTTL(
    key: string,
    value: any,
    ttl: number,
  ): Promise<void> {
    await this.redisClient.set(key, value, 'EX', ttl);
  }
}
