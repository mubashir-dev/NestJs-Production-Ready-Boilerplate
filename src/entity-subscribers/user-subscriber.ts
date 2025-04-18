import type {
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { EventSubscriber } from 'typeorm';

import { generateHash } from '../common/utils';
import type { UserEntity } from '../modules/user/entities/user.entity';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<UserEntity> {
  beforeInsert(event: InsertEvent<UserEntity>): void {
    if (event.entity.password) {
      event.entity.password = generateHash(event.entity.password);
    }

    //dummy avatar
    if (event.entity.firstName && event.entity.lastName) {
      event.entity.avatar = `https://avatar.iran.liara.run/username?username=${event.entity.firstName}+${event.entity.lastName}&background=41d159&color=d8eddb`;
    }
  }

  beforeUpdate(event: UpdateEvent<UserEntity>): void {
    const entity = event.entity as UserEntity;

    if (
      entity?.password &&
      entity?.password !== event.databaseEntity.password
    ) {
      entity.password = generateHash(entity.password!);
    }

    //dummy avatar
    if (entity.firstName && entity.lastName) {
      entity.avatar = `https://avatar.iran.liara.run/username?username=${entity.firstName}+${entity.lastName}&background=41d159&color=d8eddb`;
    }
  }
}
