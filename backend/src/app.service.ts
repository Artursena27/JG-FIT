import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return {
      status: 'ok',
      service: 'jg-fit-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
