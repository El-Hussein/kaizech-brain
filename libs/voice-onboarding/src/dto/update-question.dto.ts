import { IsString, IsOptional, IsArray, IsNumber, IsBoolean } from 'class-validator';

export class UpdateQuestionDto {
  @IsString()
  @IsOptional()
  questionText?: string;

  @IsString()
  @IsOptional()
  whyWeNeedIt?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  suggestedPoints?: string[];

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ReorderQuestionsDto {
  @IsArray()
  @IsString({ each: true })
  orderedIds: string[];
}
