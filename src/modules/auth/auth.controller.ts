import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RoleType } from '../../constants';
import { AuthService } from './auth.service';
import { UserLoginDto } from './dto/user-login.dto';
import { Request } from 'express';
import { IUser } from '../user/interface/user.interface';
import { IPageResponse } from '@src/interfaces/IPageResponse';
import { ResendOtpDto, VerifyOtpDto } from './dto/user-otp.dto';
import { ForgotPasswordInitiateDto } from '@src/modules/auth/dto/forgot-password-initiate.dto';
import { ForgotPasswordCompleteDto } from '@src/modules/auth/dto/forgot-password-complete.dto';
import { AuthUser } from '@src/decorators/auth-user.decorator';
import { Auth, RefreshAuth } from '@src/decorators/http.decorators';

@ApiTags('Authentication')
@Controller({ version: '1', path: 'auth' })
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'User login with otp',
  })
  async userLogin(@Body() userLoginDto: UserLoginDto): Promise<any> {
    return await this.authService.validateUser(userLoginDto);
  }

  @Post('login/verify/otp')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Verify login otp' })
  async verifyLoginOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return await this.authService.verifyLoginOtp(verifyOtpDto);
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get new otp' })
  async sendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return await this.authService.sendOtp(resendOtpDto?.phone);
  }

  @Get('refresh')
  @RefreshAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get new refresh token' })
  async generateNewAccessToken(@Req() request: Request) {
    const { id } = request.user as any;
    const refreshToken: string | any = request?.header('Authorization')
      ? request?.header('Authorization')?.split(' ')[1]
      : undefined;

    const tokens = await this.authService.generateNewAccessToken(id, {
      refreshToken,
    });

    return {
      data: {
        token: tokens,
      },
    };
  }

  @Post('password/forgot/initiate')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Forgot password initiate' })
  async forgotPasswordInitiate(
    @Body() forgotPasswordDto: ForgotPasswordInitiateDto,
  ) {
    return await this.authService.forgotPasswordInitiate(forgotPasswordDto);
  }

  @Post('password/forgot/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Forgot password complete' })
  async forgotPasswordComplete(
    @Body() forgotPasswordCompleteDto: ForgotPasswordCompleteDto,
  ) {
    return await this.authService.forgotPasswordComplete(
      forgotPasswordCompleteDto,
    );
  }

  @Get('logout')
  @HttpCode(HttpStatus.OK)
  @Auth([RoleType.ALL])
  @ApiOkResponse({ description: 'Get new access token' })
  async logoutUser(
    @Req() request: Request,
    @AuthUser() user: any,
  ): Promise<IPageResponse> {
    await this.authService.logout(user?._id, request?.header('Authorization'));
    return {
      message: 'You have logged out successfully',
    };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @Auth([RoleType.ALL])
  @ApiOkResponse({ description: 'Current user info' })
  getCurrentUser(@AuthUser() user: IUser): IPageResponse {
    return {
      data: user,
    };
  }
}
