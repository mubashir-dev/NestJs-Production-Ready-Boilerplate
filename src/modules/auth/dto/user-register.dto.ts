import {
  StringField,
  EmailField,
  PasswordField,
  PhoneField,
} from '@src/decorators/field.decorators';

export class UserRegisterDto {
  @StringField()
  readonly firstName!: string;

  @StringField()
  readonly lastName!: string;

  @EmailField({ required: true })
  readonly email!: string;

  @PasswordField({ minLength: 8 })
  readonly password!: string;

  @PhoneField({ required: true })
  phone?: string;
}
