import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RoleEntity } from './entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRole } from './role.interface';
import { PageOptionsDto } from '@src/common/dto/page-options.dto';
import { IPageResponse } from '@src/interfaces/IPageResponse';
import { PageMetaDto } from '@src/common/dto/page-meta.dto';
import { RoleType } from '@src/constants';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private _roleRepository: Repository<RoleEntity>,
  ) {}

  async findAll(pageOptionsDto: PageOptionsDto): Promise<IPageResponse> {
    try {
      const queryBuilder = this._roleRepository.createQueryBuilder('role');
      queryBuilder
        .orderBy('role.createdAt', pageOptionsDto.order)
        .skip(pageOptionsDto.skip)
        .take(pageOptionsDto.take);

      const itemCount = await queryBuilder.getCount();
      const { entities } = await queryBuilder.getRawAndEntities();

      return {
        data: entities,
        meta: new PageMetaDto({ itemCount, pageOptionsDto }),
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(uuid: string) {
    try {
      const data: IRole | unknown = await this._roleRepository.findOne({
        where: {
          uuid,
        },
      });

      if (!data)
        throw new HttpException(
          'The record could not be found',
          HttpStatus.NOT_FOUND,
        );

      return {
        data,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findBySlug(
    options: Partial<{ slug: RoleType }>,
  ): Promise<RoleEntity | null> {
    const queryBuilder = this._roleRepository.createQueryBuilder('role');

    if (options.slug) {
      queryBuilder.orWhere('role.roleSlug = :slug', {
        slug: options.slug,
      });
    }

    return queryBuilder.getOne();
  }
}
