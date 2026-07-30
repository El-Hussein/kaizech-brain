import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateApiKeyDto {
  @ApiProperty({ description: 'Name for the API key' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
