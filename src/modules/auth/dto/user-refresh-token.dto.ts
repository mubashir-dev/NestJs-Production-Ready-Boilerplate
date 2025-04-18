import { StringField } from 'src/decorators/field.decorators';

export class UserRefreshToken {
  @StringField()
  refreshToken!: string;
}
