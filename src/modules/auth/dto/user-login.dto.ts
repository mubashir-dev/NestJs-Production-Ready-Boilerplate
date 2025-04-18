import {
  EmailFieldOptional,
  PhoneFieldOptional,
  StringField,
} from '@src/decorators/field.decorators';

export class UserLoginDto {
  @EmailFieldOptional()
  readonly email?: string;

  @PhoneFieldOptional()
  readonly phone?: string;

  @StringField({ required: true })
  readonly password!: string;
}
