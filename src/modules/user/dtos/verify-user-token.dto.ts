import { NumberField, StringField } from '@src/decorators/field.decorators';

export class VerifyTokenDto {
  @NumberField()
  readonly userId!: number;

  @StringField()
  readonly otp!: string;
}
