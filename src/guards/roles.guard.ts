import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserEntity } from '../modules/user/entities/user.entity';
import { RoleEntity } from '@src/modules/role/entities/role.entity';
import { RoleType } from '@src/constants';
import { Roles } from '@src/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get(Roles, context.getHandler());

    if (roles.includes(RoleType.ALL)) {
      return true;
    }

    if (!roles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: UserEntity }>();
    const user = request.user;

    if (user) {
      const role: RoleEntity = user?.role as unknown as RoleEntity;
      if (roles.includes(role.roleSlug)) return true;
    }

    return false;
  }
}
