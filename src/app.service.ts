import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  ping() {
    return {
      date: new Date().toISOString().toString(),
      message: 'Welcome To IPLexPeople Server 🔥',
    };
  }
}
