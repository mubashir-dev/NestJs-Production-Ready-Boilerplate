import { DateField, NumberField } from '@src/decorators/field.decorators';
import { AbstractEntity } from '../entity/abstract.entity';

export class AbstractDto {
  @NumberField()
  id!: number;

  @DateField()
  createdAt!: Date;

  @DateField()
  updatedAt!: Date;

  constructor(entity: AbstractEntity, options?: { excludeFields?: boolean }) {
    if (!options?.excludeFields) {
      this.id = entity.id;
      this.createdAt = entity.createdAt;
      this.updatedAt = entity.updatedAt;
    }
  }
}
