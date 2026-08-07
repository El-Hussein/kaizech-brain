import { IsString, IsNotEmpty, IsOptional, IsArray, IsUrl, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ description: 'Business name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'URL-friendly slug' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ description: 'Supported languages', default: ['en'] })
  @IsOptional()
  @IsArray()
  languages?: string[];

  @ApiPropertyOptional({ description: 'Timezone', default: 'UTC' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Greeting message for users' })
  @IsOptional()
  @IsString()
  greetingMessage?: string;

  @ApiPropertyOptional({ description: 'Customer API endpoint for tool calling' })
  @IsOptional()
  @IsString()
  apiEndpoint?: string;

  @ApiPropertyOptional({ description: 'Branding configuration' })
  @IsOptional()
  @IsObject()
  branding?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Account Owner Email' })
  @IsOptional()
  @IsString()
  ownerEmail?: string;

  @ApiPropertyOptional({ description: 'Account Login Password' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'Additional settings' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Main Industry ID' })
  @IsOptional()
  @IsString()
  mainIndustryId?: string;

  @ApiPropertyOptional({ description: 'Related Industry IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedIndustryIds?: string[];
}
