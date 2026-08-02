import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntity } from '@kaizech/database';
import * as crypto from 'crypto';

import { decryptSecret } from '@kaizech/shared';

function maskSecret(key: string): string {
  if (!key) return 'NONE';
  if (key.length <= 8) return '••••••••';
  return `${key.substring(0, 4)}••••••••${key.substring(key.length - 4)}`;
}

@Injectable()
export class MetaSignatureGuard implements CanActivate {
  private readonly logger = new Logger(MetaSignatureGuard.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
  ) {}

  private getSecretFromSettings(settings: Record<string, any> | undefined): string | undefined {
    if (!settings) return undefined;
    return (
      settings.whatsappAppSecret ||
      settings.WHATSAPP_APP_SECRET ||
      settings.whatsapp_app_secret ||
      settings.appSecret
    );
  }

  private getSecretFromEnv(): string | undefined {
    return (
      this.configService.get<string>('WHATSAPP_APP_SECRET') ||
      process.env.WHATSAPP_APP_SECRET ||
      process.env.whatsapp_app_secret ||
      process.env.whatsappAppSecret
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const signature = request.headers['x-hub-signature-256'] as string;
    if (!signature) {
      throw new ForbiddenException('Missing X-Hub-Signature-256 header');
    }

    // Resolve the App Secret: check tenant-level, default tenant, and env vars
    const tenantId = request.params?.tenantId;
    let rawAppSecret: string | undefined;
    let resolutionSource = 'NONE';

    if (tenantId) {
      const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
      rawAppSecret = this.getSecretFromSettings(tenant?.settings);
      if (rawAppSecret) {
        resolutionSource = `Tenant Settings (${tenant?.name || tenantId})`;
      }
    }

    if (!rawAppSecret) {
      const defaultTenant = await this.tenantRepository.findOne({ where: { slug: 'mrkoon-auctions' } });
      rawAppSecret = this.getSecretFromSettings(defaultTenant?.settings);
      if (rawAppSecret) {
        resolutionSource = `Default Tenant Settings (${defaultTenant?.name || 'mrkoon-auctions'})`;
      }
    }

    if (!rawAppSecret) {
      // Fallback: check any active tenant in database
      const tenants = await this.tenantRepository.find({ take: 5 });
      for (const t of tenants) {
        const sec = this.getSecretFromSettings(t.settings);
        if (sec) {
          rawAppSecret = sec;
          resolutionSource = `Active Tenant Settings (${t.name})`;
          break;
        }
      }
    }

    if (!rawAppSecret) {
      rawAppSecret = this.getSecretFromEnv();
      if (rawAppSecret) {
        resolutionSource = 'Environment Variable (WHATSAPP_APP_SECRET)';
      }
    }

    const appSecret = decryptSecret(rawAppSecret || '');

    if (!appSecret) {
      this.logger.error(
        'WHATSAPP_APP_SECRET is not configured on any tenant or env — cannot validate Meta signature',
      );
      throw new ForbiddenException(
        'WhatsApp App Secret is not configured. Please save it under Settings & API Keys in Dashboard or set WHATSAPP_APP_SECRET environment variable.',
      );
    }

    this.logger.log(
      `Meta signature secret resolved [Source: ${resolutionSource}]: ${maskSecret(appSecret)} (${appSecret.length} chars)`,
    );

    // rawBody is populated by NestFactory.create({ rawBody: true })
    const rawBody: Buffer = request.rawBody;
    if (!rawBody) {
      throw new ForbiddenException('Raw body not available for signature validation');
    }

    const expectedSignature =
      'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    // Constant-time comparison to prevent timing attacks
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      this.logger.warn(
        `Invalid Meta signature for tenant ${tenantId ?? 'unknown'} (Key length: ${appSecret.length} chars)`,
      );
      throw new ForbiddenException('Invalid X-Hub-Signature-256 — request did not come from Meta');
    }

    this.logger.debug(`Meta signature verified for tenant ${tenantId ?? 'default'}`);
    return true;
  }
}
