import { Injectable } from '@nestjs/common';
import { v1 as uuid } from 'uuid';
import * as speakeasy from 'speakeasy';

@Injectable()
export class GeneratorService {
  public uuid(): string {
    return uuid();
  }

  public fileName(ext: string): string {
    return this.uuid() + '.' + ext;
  }

  public generateOTP(): { secret: string; otp: string } {
    const secret: string = speakeasy.generateSecret().base32;
    const otp = speakeasy.totp({
      secret,
      encoding: 'base32',
    });

    return {
      secret,
      otp,
    };
  }
}
