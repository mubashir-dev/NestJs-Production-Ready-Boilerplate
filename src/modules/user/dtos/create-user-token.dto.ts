import {
  DateField,
  NumberField,
  StringField,
} from '@src/decorators/field.decorators';

export class CreateTokenDto {
  @NumberField()
  readonly userId!: number;

  @StringField()
  readonly otp!: string;

  @DateField()
  readonly ttl!: Date;
}
