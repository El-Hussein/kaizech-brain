import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity, ApiKeyEntity } from '@kaizech/database';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantEntity, ApiKeyEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'default-secret-key-kaizech-2026'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', '30d'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [ApiKeyGuard, ApiKeyStrategy, AuthService],
  exports: [ApiKeyGuard, ApiKeyStrategy, JwtModule, AuthService],
})
export class AuthModule {}
