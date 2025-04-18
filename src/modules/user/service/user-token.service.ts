import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { FindOptionsWhere } from 'typeorm';
import { Repository } from 'typeorm';
import { CreateTokenDto } from '../dtos/create-user-token.dto';
import { VerifyTokenDto } from '../dtos/verify-user-token.dto';
import { UserTokenEntity } from '../entities/user-token.entity';

@Injectable()
export class UserTokenService {
  constructor(
    @InjectRepository(UserTokenEntity)
    private userTokenRepository: Repository<UserTokenEntity>,
  ) {}

  findOne(
    findData: FindOptionsWhere<UserTokenEntity>,
  ): Promise<UserTokenEntity | null> {
    return this.userTokenRepository.findOneBy(findData);
  }

  async createToken(createTokenDto: CreateTokenDto): Promise<UserTokenEntity> {
    try {
      //one user can have only one token at a time
      await this.userTokenRepository.delete({ userId: createTokenDto.userId });
      const token = this.userTokenRepository.create(createTokenDto);
      await this.userTokenRepository.save(token);
      return token;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async checkTokenExpiration(verifyTokenDto: VerifyTokenDto): Promise<boolean> {
    try {
      const { otp, userId } = verifyTokenDto;

      //fetch user token
      const userOtp: UserTokenEntity | null = await this.findOne({
        otp,
        userId,
        status: false,
      });

      if (!userOtp)
        throw new HttpException(
          'The otp could not be found',
          HttpStatus.BAD_REQUEST,
        );

      if (userOtp?.ttl && (userOtp.ttl as any) <= new Date()) {
        //TODO: Need to fix this
        throw new HttpException('The otp has expired', HttpStatus.BAD_REQUEST);
      }

      //update token status
      Object.assign(userOtp, { status: true });
      await userOtp.save();

      return true;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteToken(userId: number): Promise<Boolean> {
    try {
      const token = await this.userTokenRepository.delete({ userId });
      return !token;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
