import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { AuthService } from './auth.service';

export class LoginDto {
  @ApiPropertyOptional({ description: 'Workspace ID / Slug', example: 'mrkoon' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'Account Email', example: 'mrkoon@tenant.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Account Password' })
  @IsOptional()
  @IsString()
  password?: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Tenant workspace account login' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
