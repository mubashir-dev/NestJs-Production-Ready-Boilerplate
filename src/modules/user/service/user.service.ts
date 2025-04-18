import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageMetaDto } from '@src/common/dto/page-meta.dto';
import { IPageResponse } from '@src/interfaces/IPageResponse';
import type { FindOptionsWhere } from 'typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { UsersPageOptionsDto } from '../dtos/users-page-options.dto';
import { UserEntity } from '../entities/user.entity';
import { IUser } from '../interface/user.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  findOne(findData: FindOptionsWhere<IUser>): Promise<IUser | null> {
    return this.userRepository.findOneBy(findData);
  }

  async findByPhoneOrEmail(
    options: Partial<{ email: string; phone: string }>,
  ): Promise<IUser | null> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (options.email) {
      queryBuilder.orWhere('user.email = :email', {
        email: options.email,
      });
    }

    if (options.phone) {
      queryBuilder.orWhere('user.phone = :phone', {
        phone: options.phone,
      });
    }

    return queryBuilder.getOne();
  }

  @Transactional()
  async createUser(createUserDto: unknown): Promise<IUser> {
    try {
      const user = this.userRepository.create(createUserDto as IUser);
      await this.userRepository.save(user);
      return user;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateUser(userId: number, updateUserDto: unknown): Promise<IUser> {
    try {
      const user = await this.findOne({ id: userId });

      if (!user)
        throw new HttpException(
          'The user record could not be found',
          HttpStatus.NOT_FOUND,
        );

      await this.userRepository.save({ ...user, ...(updateUserDto as any) });
      return user;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUsers(pageOptionsDto: UsersPageOptionsDto): Promise<IPageResponse> {
    const data = await this.userRepository.createQueryBuilder('user').getMany();
    return {
      data: data,
      meta: new PageMetaDto({ pageOptionsDto, itemCount: 10 }),
    };
  }

  async getUser(userId: number): Promise<IUser> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    queryBuilder.where('user.id = :userId', { userId });

    const IUser = await queryBuilder.getOne();

    if (!IUser) {
      throw new HttpException(
        'The user record could not be found',
        HttpStatus.NOT_FOUND,
      );
    }

    return IUser;
  }
}
