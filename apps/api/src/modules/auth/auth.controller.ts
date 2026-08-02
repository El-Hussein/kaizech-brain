import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';

export class LoginDto {
  slug?: string;
  email?: string;
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
