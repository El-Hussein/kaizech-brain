import { IsString, IsArray, IsBoolean, IsOptional } from 'class-validator';

export class CreateWorkflowDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  triggerKeywords: string[];

  @IsOptional()
  @IsString()
  semanticIntent?: string;

  // By completely omitting class-validator decorators for nodes except IsOptional, 
  // wait, if I omit it, it strips it. 
  // Let's explicitly NOT strip it by making it a string, then JSON.parsing it in the service!
}
