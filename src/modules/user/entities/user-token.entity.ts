import { Column, Entity, Timestamp } from 'typeorm';
import { AbstractEntity } from '@src/common/entity/abstract.entity';

@Entity({ name: 'users_token' })
export class UserTokenEntity extends AbstractEntity {
  @Column({ type: 'integer', nullable: false })
  userId!: number;

  @Column({ unique: true, nullable: false, type: 'varchar' })
  otp!: string | null;

  @Column({ nullable: false, type: 'timestamp' })
  ttl!: Timestamp | null;

  @Column({ type: 'boolean', default: false })
  status!: boolean;
}
