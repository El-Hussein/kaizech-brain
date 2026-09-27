import { IsString, IsArray, IsBoolean, IsOptional, IsObject } from 'class-validator';

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

  @IsArray()
  nodes: any[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;
}

export class UpdateWorkflowDto extends CreateWorkflowDto {}
