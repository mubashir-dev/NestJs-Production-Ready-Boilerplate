import { PasswordField, StringField } from '@src/decorators/field.decorators';

export class ForgotPasswordCompleteDto {
  @PasswordField({ minLength: 8, required: true })
  password!: string;

  @PasswordField({ minLength: 8, required: true })
  confirmPassword!: string;

  @StringField({ required: true })
  otp!: string;
}
