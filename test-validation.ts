import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { Allow } from 'class-validator';

class TestDto {
  @Allow()
  nodes: any[];
}

async function run() {
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  const result = await pipe.transform({ nodes: [{ id: "123", type: "api_fetch" }] }, { type: 'body', metatype: TestDto });
  console.log('Result:', JSON.stringify(result));
}
run().catch(console.error);
