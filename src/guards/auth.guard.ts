import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@src/modules/redis/redis.service';
import { UserService } from '@src/modules/user/service/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException(
        'The token provided is no longer valid or has expired',
      );
    }

    const isBlacklisted = await this.redisService.getValue(token);
    if (isBlacklisted) {
      throw new UnauthorizedException(
        'The token provided is no longer valid or has expired',
      );
    }

    try {
      const decoded = this.jwtService.verify(token);
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
        'The token provided is no longer valid or has expired',
      );
    }
  }
}
