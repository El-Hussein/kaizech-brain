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

@Injectable()
export class MetaSignatureGuard implements CanActivate {
  private readonly logger = new Logger(MetaSignatureGuard.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const signature = request.headers['x-hub-signature-256'] as string;
    if (!signature) {
      throw new ForbiddenException('Missing X-Hub-Signature-256 header');
    }

    // Resolve the App Secret: tenant-level setting takes priority, fallback to default tenant & global env
    const tenantId = request.params?.tenantId;
    let rawAppSecret: string | undefined;

    if (tenantId) {
      const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
      rawAppSecret = tenant?.settings?.whatsappAppSecret;
    }

    if (!rawAppSecret) {
      const defaultTenant = await this.tenantRepository.findOne({ where: { slug: 'mrkoon-auctions' } });
      rawAppSecret = defaultTenant?.settings?.whatsappAppSecret;
    }

    if (!rawAppSecret) {
      rawAppSecret = this.configService.get<string>('WHATSAPP_APP_SECRET', '');
    }

    const appSecret = decryptSecret(rawAppSecret || '');

    if (!appSecret) {
      this.logger.error('WHATSAPP_APP_SECRET is not configured — cannot validate Meta signature');
      throw new ForbiddenException('WhatsApp App Secret is not configured. Please save it under Settings & API Keys in Dashboard.');
    }

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
      this.logger.warn(`Invalid Meta signature for tenant ${tenantId ?? 'unknown'}`);
      throw new ForbiddenException('Invalid X-Hub-Signature-256 — request did not come from Meta');
    }

    this.logger.debug(`Meta signature verified for tenant ${tenantId}`);
    return true;
  }
}
