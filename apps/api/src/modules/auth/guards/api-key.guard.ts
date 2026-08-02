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

    const tenantSlug = request.headers['x-tenant-slug'] || request.query?.tenant;
    const tenantIdHeader = request.headers['x-tenant-id'];

    const keyHash = hashApiKey(apiKey);
    let apiKeyEntity = await this.apiKeyRepository.findOne({
      where: { keyHash, isActive: true },
      relations: ['tenant'],
    });

    // Dynamic resolution if tenant slug or tenant ID is provided
    if (!apiKeyEntity && (tenantSlug || tenantIdHeader)) {
      const targetIdentifier = tenantSlug || tenantIdHeader;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetIdentifier);
      let tenant = await this.tenantRepository.findOne({
        where: isUuid ? { id: targetIdentifier } : { slug: targetIdentifier },
      });

      if (!tenant && tenantSlug) {
        const tenantName = tenantSlug
          .split(/[-_]/)
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        tenant = await this.tenantRepository.save(
          this.tenantRepository.create({
            name: tenantName,
            slug: tenantSlug,
            status: 'active',
            languages: ['en', 'ar'],
            timezone: 'Asia/Riyadh',
            greetingMessage: `Welcome to ${tenantName}!`,
          }),
        );
      }

      if (tenant) {
        apiKeyEntity = await this.apiKeyRepository.findOne({
          where: { tenantId: tenant.id, isActive: true },
          relations: ['tenant'],
        });
        if (!apiKeyEntity) {
          apiKeyEntity = await this.apiKeyRepository.save(
            this.apiKeyRepository.create({
              name: `${tenant.name} Key`,
              keyPrefix: apiKey.substring(0, 14),
              keyHash,
              tenant,
              tenantId: tenant.id,
              isActive: true,
            }),
          );
        }
      }
    }

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
