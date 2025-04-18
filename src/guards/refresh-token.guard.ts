import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@src/modules/redis/redis.service';
import { ApiConfigService } from '@src/shared/services/api-config.service';
import { UserService } from '@src/modules/user/service/user.service';

@Injectable()
export class RefreshGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private apiConfigService: ApiConfigService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException(
        'The refresh token provided is no longer valid or has expired',
      );
    }

    const isBlacklisted = await this.redisService.getValue(token);
    if (isBlacklisted) {
      throw new UnauthorizedException(
        'The refresh token provided is no longer valid or has expired',
      );
    }

    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.apiConfigService.authConfig.jwtRefreshSecret,
        algorithms: ['HS256'],
      });
      if (!decoded) return false;

      const user = await this.userService.findOne({
        id: decoded.userId as number,
      });

      if (!user) {
        throw new UnauthorizedException();
      }
      request.user = user;
      return true;
    } catch (err) {
      throw new UnauthorizedException(
        'The refresh token provided is no longer valid or has expired',
      );
    }
  }
}
