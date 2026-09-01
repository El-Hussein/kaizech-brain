import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, IsBoolean } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @IsString()
  @IsOptional()
  whyWeNeedIt?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  suggestedPoints?: string[];

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
