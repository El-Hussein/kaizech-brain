import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsNotEmpty()
  answerText: string;

  @IsString()
  @IsIn(['voice', 'typed'])
  inputMethod: 'voice' | 'typed';
}

export class SubmitFollowUpDto {
  @IsString()
  @IsNotEmpty()
  answerText: string;

  @IsString()
  @IsIn(['voice', 'typed'])
  @IsOptional()
  inputMethod?: 'voice' | 'typed';
}
