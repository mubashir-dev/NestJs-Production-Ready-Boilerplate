import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { TokenType } from '@src/constants';
import { IUser } from '@src/modules/user/interface/user.interface';
import { UserService } from '@src/modules/user/service/user.service';
import { ApiConfigService } from '@src/shared/services/api-config.service';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ApiConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.authConfig.jwtAccessSecret,
      algorithms: ['HS256'],
    });
  }

  async validate(args: { userId: string; type: TokenType }): Promise<IUser> {
    if (args.type !== TokenType.ACCESS_TOKEN) {
      throw new UnauthorizedException();
    }

    const user = await this.userService.findOne({
      id: args.userId as never,
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
