import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenType } from '../../../constants';
import { ApiConfigService } from '../../../shared/services/api-config.service';
import { Request } from 'express';
import { IUser } from '@src/modules/user/interface/user.interface';
import { UserService } from '@src/modules/user/service/user.service';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ApiConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.authConfig.jwtRefreshSecret,
      passReqToCallback: false,
      algorithms: ['HS256'],
    });
  }

  async validate(req: Request, payload: any): Promise<IUser> {
    if (payload.type !== TokenType.REFRESH_TOKEN) {
      throw new UnauthorizedException();
    }

    const refreshToken = req
      ?.get('Authorization')
      ?.replace('Bearer ', '')
      .trim();

    const user = await this.userService.findOne({
      id: payload.userId,
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return { ...user, refreshToken } as IUser;
  }
}
