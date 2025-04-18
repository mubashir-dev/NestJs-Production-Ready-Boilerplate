import { StringField, PhoneField } from '@src/decorators/field.decorators';

export class VerifyOtpDto {
  @StringField({ required: true })
  readonly otp!: string;

  @PhoneField({ required: true })
  readonly phone!: string;
}

export class ResendOtpDto {
  @PhoneField({ required: true })
  readonly phone!: string;
}
