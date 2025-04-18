import { PhoneField } from '@src/decorators/field.decorators';

export class ForgotPasswordInitiateDto {
  @PhoneField({ required: true })
  readonly phone!: string;
}
