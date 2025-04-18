import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../../common/entity/abstract.entity';
import { RoleType } from '../../../constants/role-type';

@Entity({ name: 'roles' })
export class RoleEntity extends AbstractEntity {
  @Column({ nullable: true, type: 'varchar' })
  title!: string | null;

  @Column({ nullable: true, type: 'varchar' })
  description!: string | null;

  @Column({ type: 'enum', enum: RoleType })
  roleSlug!: RoleType;

  @Column({ type: 'json', nullable: true }) //TODO:need to map this to permission json
  permission!: any;
}
