import {
  StringField,
  NumberField,
  ClassField,
} from 'src/decorators/field.decorators';

class TokenDto {
  @StringField()
  token!: string;

  @NumberField()
  expireIn!: string;
}

export class UserTokenDto {
  @ClassField(() => TokenDto)
  access!: TokenDto;

  @ClassField(() => TokenDto)
  refresh!: TokenDto;
}
