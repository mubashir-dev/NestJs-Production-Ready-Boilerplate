import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PageOptionsDto } from '@src/common/dto/page-options.dto';
import { IPageResponse } from '@src/interfaces/IPageResponse';
import { RoleType } from '@src/constants';
import { Auth } from '@src/decorators/http.decorators';

@Controller({ version: '1', path: 'roles' })
@ApiTags('Role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.DRIVER])
  @ApiOkResponse({ type: 'any', description: 'get roles list' })
  findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<IPageResponse> {
    return this.roleService.findAll(pageOptionsDto);
  }

  @Get(':uuid')
  @HttpCode(HttpStatus.OK)
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.DRIVER])
  @ApiOkResponse({ type: 'any', description: 'get role' })
  async findOne(@Param('uuid') uuid: string) {
    const data = await this.roleService.findOne(uuid);
    return {
      data,
    };
  }
}
