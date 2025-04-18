import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth, UUIDParam } from '@src/decorators/http.decorators';
import { RoleType } from '../../constants';
import { IPageResponse } from '../../interfaces/IPageResponse';
import { UsersPageOptionsDto } from './dtos/users-page-options.dto';
import { UserService } from './service/user.service';

@Controller({ version: '1', path: 'users' })
@ApiTags('Users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @Auth([RoleType.USER])
  @HttpCode(HttpStatus.OK)
  getUsers(
    @Query()
    pageOptionsDto: UsersPageOptionsDto,
  ): Promise<IPageResponse> {
    return this.userService.getUsers(pageOptionsDto);
  }

  @Get(':id')
  @Auth([RoleType.USER])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get users list',
  })
  getUser(@UUIDParam('id') userId: number): Promise<any> {
    return this.userService.getUser(userId);
  }
}
