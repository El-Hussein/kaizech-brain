import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiKeyStrategy {
  // Placeholder for future JWT/OAuth strategies
  validate(payload: any): any {
    return payload;
  }
}
