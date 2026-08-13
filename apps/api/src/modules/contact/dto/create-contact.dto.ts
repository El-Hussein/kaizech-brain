import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  companySize?: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
