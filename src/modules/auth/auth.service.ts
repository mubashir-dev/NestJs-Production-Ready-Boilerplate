import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { generateHash, validateHash } from '@src/common/utils';
import { RoleType, TokenType } from '../../constants';
import { ApiConfigService } from '../../shared/services/api-config.service';
import type { UserLoginDto } from './dto/user-login.dto';
import { UserTokenDto } from './dto/user-token.dto';
import { UserRefreshToken } from './dto/user-refresh-token.dto';
import { USER_STATUS } from '../user/constant/user.constant';
import { GeneratorService } from '@src/shared/services/generator.service';
import { IPageResponse } from '@src/interfaces/IPageResponse';
import { VerifyOtpDto } from './dto/user-otp.dto';
import { omit } from 'lodash';
import * as speakeasy from 'speakeasy';
import { UserService } from '../user/service/user.service';
import { UserTokenService } from '../user/service/user-token.service';
import { ForgotPasswordInitiateDto } from '@src/modules/auth/dto/forgot-password-initiate.dto';
import { IUser } from '@src/modules/user/interface/user.interface';
import { ForgotPasswordCompleteDto } from '@src/modules/auth/dto/forgot-password-complete.dto';
import { RedisService } from '@src/modules/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ApiConfigService,
    private userService: UserService,
    private userTokenService: UserTokenService,
    private readonly generatorService: GeneratorService,
    private readonly redisService: RedisService,
  ) {}

  async validateUser(userLoginDto: UserLoginDto): Promise<any> {
    try {
      const findQuery: Record<string, string> = {};
      if (!userLoginDto?.phone && !userLoginDto?.email) {
        throw new HttpException(
          'Phone number or email is required to log in.',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (userLoginDto?.phone) {
        findQuery.phone = userLoginDto.phone;
      }

      if (userLoginDto?.email) {
        findQuery.email = userLoginDto.email;
      }

      const user = await this.userService.findOne(findQuery);

      //check if user exists
      if (!user)
        throw new HttpException(
          'The password or email are incorrect',
          HttpStatus.BAD_REQUEST,
        );

      //pending verification check
      if (
        user.role.roleSlug == RoleType.DRIVER &&
        user?.status == USER_STATUS.PENDING
      ) {
        throw new HttpException(
          'Your application is still in the queue ⏳. We will let you know when it gets approved ✅.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const isPasswordValid = await validateHash(
        userLoginDto.password,
        user?.password,
      );

      if (!isPasswordValid) {
        throw new HttpException(
          'The record could not be found',
          HttpStatus.NOT_FOUND,
        );
      }

      //no need to send otp,if the role type is consumer
      if (
        user?.role.roleSlug == RoleType.CONSUMER ||
        user?.role.roleSlug == RoleType.DRIVER
      ) {
        return {
          data: {
            user: omit(user, 'password'),
            token: await this.createTokens({
              userId: user?.id,
            }),
          },
          message: 'Login successful',
        };
      }

      //send otp to the user
      const { phone } = user;
      return await this.sendOtp(phone);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createTokens(data: { userId: number }): Promise<UserTokenDto> {
    try {
      //create access and refresh tokens
      const [accessToken, refreshToken]: [string, string] = await Promise.all([
        this.generateAccessToken(data),
        this.generateRefreshToken(data),
      ]);

      //save refresh token into the database
      await this.saveRefreshToken(data.userId, refreshToken);

      return {
        access: {
          token: accessToken,
          expireIn: this.configService.authConfig.jwtAccessExpirationTime,
        },
        refresh: {
          token: refreshToken,
          expireIn: this.configService.authConfig.jwtRefreshExpirationTime,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async generateAccessToken(payload: { userId: number }): Promise<string> {
    try {
      return this.jwtService.signAsync(
        {
          userId: payload.userId,
          type: TokenType.ACCESS_TOKEN,
        },
        {
          expiresIn: this.configService.authConfig.jwtAccessExpirationTime,
          secret: this.configService.authConfig.jwtAccessSecret,
          algorithm: 'HS256',
        },
      );
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async generateRefreshToken(payload: { userId: number }): Promise<string> {
    try {
      return this.jwtService.signAsync(
        {
          userId: payload.userId,
          type: TokenType.REFRESH_TOKEN,
        },
        {
          expiresIn: this.configService.authConfig.jwtRefreshExpirationTime,
          secret: this.configService.authConfig.jwtRefreshSecret,
          algorithm: 'HS256',
        },
      );
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async saveRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<boolean> {
    try {
      const encryptRefreshToken = generateHash(refreshToken);
      await this.userService.updateUser(userId, {
        refreshToken: encryptRefreshToken,
      });
      return true;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async generateNewAccessToken(
    userId: number,
    { refreshToken }: UserRefreshToken,
  ) {
    try {
      const userToken = await this.userService.getUser(userId);
      if (!userToken)
        throw new HttpException(
          'The refresh token is invalid.',
          HttpStatus.BAD_REQUEST,
        );

      const tokenValidity = await validateHash(
        refreshToken,
        userToken?.refreshToken,
      );

      if (!tokenValidity) {
        throw new HttpException(
          'The refresh token is invalid.',
          HttpStatus.BAD_REQUEST,
        );
      }

      //generate new access token/refresh token
      const tokens = await this.createTokens({ userId });

      //update refresh token
      await this.saveRefreshToken(userId, tokens?.refresh.token);

      return tokens;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendOtp(phone: string): Promise<IPageResponse> {
    try {
      //check if the user exists
      const user = await this.userService.findOne({ phone });
      if (!user) throw new HttpException('The user could not be found.', 404);

      //delete all previous otp records
      await this.userTokenService.deleteToken(user?.id);

      //generate otp and secret token
      const { otp, secret } = this.generatorService.generateOTP();

      if (user) {
        await Promise.allSettled([
          this.userTokenService.createToken({
            userId: user?.id,
            otp,
            ttl: new Date(Date.now() + 2 * 60 * 1000), //120 seconds
          }),
          this.userService.updateUser(user?.id, { secret }),
        ]);
      }

      return {
        data: {
          otp,
        },
        message: `OTP has been sent to ${phone}`,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async forgotPasswordInitiate(forgotPasswordDto: ForgotPasswordInitiateDto) {
    try {
      const { phone } = forgotPasswordDto;
      const user: IUser | null = await this.userService.findOne({
        phone,
      });

      if (!user) throw new HttpException("The record couldn't be found.", 404);

      //send otp
      return await this.sendOtp(phone);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async forgotPasswordComplete(
    forgotPasswordCompleteDto: ForgotPasswordCompleteDto,
  ): Promise<IPageResponse> {
    try {
      const { password, confirmPassword, otp } = forgotPasswordCompleteDto;

      const userToken = await this.userTokenService.findOne({
        otp,
      });
      if (!userToken)
        throw new HttpException(
          'The otp record has not been found',
          HttpStatus.BAD_REQUEST,
        );

      const user = await this.userService.findOne({ id: userToken?.userId });
      if (!user)
        throw new HttpException(
          "The user record couldn't be found",
          HttpStatus.BAD_REQUEST,
        );

      //check otp expiry
      const isExpiredToken = await this.userTokenService.checkTokenExpiration({
        userId: user?.id,
        otp,
      });
      if (!isExpiredToken)
        throw new HttpException(
          'The otp has been expired',
          HttpStatus.BAD_REQUEST,
        );

      if (password !== confirmPassword)
        throw new HttpException(
          'The confirm password must match password value',
          HttpStatus.BAD_REQUEST,
        );

      const passwordUpate = await this.userService.updateUser(user?.id, {
        password,
      });

      if (!passwordUpate)
        throw new HttpException(
          'Password resetting process has been failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );

      //delete otp token
      await this.userTokenService.deleteToken(user?.id);

      return {
        message: 'Password has been reset successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifyLoginOtp(verifyOtpDto: VerifyOtpDto): Promise<any> {
    try {
      const { phone, otp } = verifyOtpDto;

      //check if the user exists
      const user = await this.userService.findByPhoneOrEmail({ phone });

      if (!user)
        throw new HttpException(
          'The user record could not be found',
          HttpStatus.NOT_FOUND,
        );

      const isSecretVerified = speakeasy.totp.verify({
        secret: user?.secret as string,
        encoding: 'base32',
        token: otp,
        window: 1,
      });

      if (!isSecretVerified)
        throw new HttpException(
          'The secret token is invalid',
          HttpStatus.BAD_REQUEST,
        );

      //user otp verification
      const userOtp: boolean = await this.userTokenService.checkTokenExpiration(
        {
          otp,
          userId: user.id,
        },
      );

      if (userOtp) {
        //delete otp from the records and secret from the users table
        await Promise.all([
          this.userService.updateUser(user?.id, { secret: null }),
          this.userTokenService.deleteToken(user?.id),
        ]);

        return {
          data: {
            user: omit(user, 'password'),
            token: await this.createTokens({
              userId: user?.id,
            }),
          },
          message: 'Login successful',
        };
      }

      return {
        message: 'Otp verification failed',
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async logout(userId: number, token?: string): Promise<boolean> {
    try {
      await this.userService.updateUser(userId, {
        refreshToken: null,
        secret: null,
      });
      if (token) {
        const bearerToken = token ? token.split(' ')[1] : undefined;
        const tokenExpiration = this.getTokenExpiration(token);
        if (tokenExpiration && bearerToken) {
          await this.redisService.setValueWithCustomTTL(
            bearerToken,
            1, // true
            Math.floor(tokenExpiration as number),
          );
        }
      }

      return true;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getTokenExpiration(token: string): number | any {
    if (token) {
      const tokenParsed = token.split('.')[1];
      // @ts-ignore
      const payload = JSON.parse(Buffer.from(tokenParsed, 'base64').toString());
      const now = Math.floor(Date.now() / 1000);
      return Math.round(payload.exp - now); //expire time in minutes
    }
  }
}
