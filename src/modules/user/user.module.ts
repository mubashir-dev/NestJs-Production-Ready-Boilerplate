import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTokenEntity } from './entities/user-token.entity';
import { UserEntity } from './entities/user.entity';
import { UserTokenService } from './service/user-token.service';
import { UserService } from './service/user.service';
import { UserController } from './user.controller';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([UserEntity, UserTokenEntity]),
  ],
  controllers: [UserController],
  exports: [UserService],
  providers: [UserService, UserTokenService],
})
export class UserModule {}
