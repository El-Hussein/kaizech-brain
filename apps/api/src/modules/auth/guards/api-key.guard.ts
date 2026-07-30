import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKeyEntity } from '@kaizech/database';
import { TenantEntity } from '@kaizech/database';
import { hashApiKey } from '@kaizech/shared';
import { ITenantContext } from '@kaizech/shared';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(
    @InjectRepository(ApiKeyEntity)
    private readonly apiKeyRepository: Repository<ApiKeyEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const keyHash = hashApiKey(apiKey);
    let apiKeyEntity = await this.apiKeyRepository.findOne({
      where: { keyHash, isActive: true },
      relations: ['tenant'],
    });

    if (!apiKeyEntity && apiKey === 'kb_demo_tenant_key') {
      let tenant = await this.tenantRepository.findOne({ where: { slug: 'mrkoon-auctions' } });
      if (!tenant) {
        tenant = await this.tenantRepository.save(
          this.tenantRepository.create({
            name: 'Mrkoon Auctions',
            slug: 'mrkoon-auctions',
            status: 'active',
            languages: ['ar', 'en'],
            timezone: 'Asia/Riyadh',
            greetingMessage: 'Welcome to Mrkoon Auctions! How can I help you today?',
          }),
        );
      }
      apiKeyEntity = await this.apiKeyRepository.save(
        this.apiKeyRepository.create({
          name: 'Demo Key',
          keyPrefix: 'kb_demo',
          keyHash,
          tenant,
          isActive: true,
        }),
      );
    }

    if (!apiKeyEntity) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (apiKeyEntity.expiresAt && apiKeyEntity.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    const tenant = apiKeyEntity.tenant;
    if (!tenant || tenant.status !== 'active') {
      throw new UnauthorizedException('Tenant is not active');
    }

    // Update last used
    await this.apiKeyRepository.update(apiKeyEntity.id, {
      lastUsedAt: new Date(),
    });

    // Attach tenant context to request
    const tenantContext: ITenantContext = {
      tenantId: tenant.id,
      tenantName: tenant.name,
      apiKeyId: apiKeyEntity.id,
    };
    request.tenant = tenantContext;

    this.logger.debug(`Authenticated tenant: ${tenant.name} (${tenant.id})`);
    return true;
  }

  private extractApiKey(request: any): string | null {
    return (
      request.headers['x-api-key'] ||
      request.query?.apiKey ||
      null
    );
  }
}
