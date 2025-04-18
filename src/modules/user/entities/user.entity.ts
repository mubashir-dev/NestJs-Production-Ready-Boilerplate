import { AbstractEntity } from '@src/common/entity/abstract.entity';
import { RoleEntity } from '@src/modules/role/entities/role.entity';
import { Column, Entity, JoinColumn, ManyToOne, VirtualColumn } from 'typeorm';
import { USER_STATUS } from '../constant/user.constant';

@Entity({ name: 'users' })
export class UserEntity extends AbstractEntity {
  @Column({ nullable: true, type: 'varchar' })
  firstName!: string | null;

  @Column({ nullable: true, type: 'varchar' })
  lastName!: string | null;

  @VirtualColumn({
    query: (alias) => `(${alias}.firstName || ' ') || ${alias}.lastName`,
  })
  fullName!: string;

  @Column({ type: 'integer', nullable: false, unique: false })
  roleId!: number;

  @Column({ unique: true, nullable: false, type: 'varchar' })
  email!: string | null;

  @Column({ nullable: true, type: 'varchar' })
  password?: string;

  @Column({ nullable: false, type: 'varchar', unique: true })
  phone!: string;

  @Column({ nullable: true, type: 'varchar', default: null })
  refreshToken!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updatedBy!: UserEntity | null;

  @Column({
    type: 'enum',
    enum: USER_STATUS,
    default: USER_STATUS.PENDING,
  })
  status!: USER_STATUS;

  @Column({ nullable: true, type: 'varchar', default: null })
  address!: string | null;

  @Column({ nullable: true, type: 'varchar', default: null })
  avatar!: string | null;

  @Column({ nullable: true, type: 'varchar', default: null }) //This will be used for opt verification
  secret!: string | null;

  @ManyToOne(() => RoleEntity, { nullable: true, eager: true })
  @JoinColumn({ name: 'role_id' })
  role!: RoleEntity;
}
