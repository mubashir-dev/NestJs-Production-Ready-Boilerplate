import { ClassField } from '@src/decorators/field.decorators';
import { TokenPayloadDto } from './token-payload.dto';

export class LoginPayloadDto {
  user: any;

  @ClassField(() => TokenPayloadDto)
  token: TokenPayloadDto;

  constructor(user: any, token: TokenPayloadDto) {
    this.user = user;
    this.token = token;
  }
}
