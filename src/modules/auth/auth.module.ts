import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneratorService } from '@src/shared/services/generator.service';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { UserTokenEntity } from '../user/entities/user-token.entity';
import { UserEntity } from '../user/entities/user.entity';
import { UserTokenService } from '../user/service/user-token.service';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccessTokenStrategy } from './strategies/access.strategy';
import { RefreshJwtStrategy } from './strategies/refresh.strategy';

@Module({
  imports: [
    forwardRef(() => UserModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: ApiConfigService) => ({
        secret: configService.authConfig.jwtAccessSecret,
        signOptions: {
          expiresIn: configService.authConfig.jwtAccessExpirationTime,
          issuer: `http://iplexpeople.org`,
          algorithm: 'HS256',
        },
      }),
      inject: [ApiConfigService],
    }),
    TypeOrmModule.forFeature([UserEntity, UserTokenEntity]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenStrategy,
    RefreshJwtStrategy,
    UserTokenService,
    GeneratorService,
  ],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
