import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { TenantEntity, ApiKeyEntity } from '@kaizech/database';
import { generateApiKey, hashApiKey } from '@kaizech/shared';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(ApiKeyEntity)
    private readonly apiKeyRepository: Repository<ApiKeyEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: { slug?: string; email?: string; password?: string }) {
    const slug = dto.slug?.trim().toLowerCase();
    const email = dto.email?.trim().toLowerCase();

    let tenant: TenantEntity | null = null;

    if (slug) {
      tenant = await this.tenantRepository.findOne({ where: { slug } });
    }

    if (!tenant && email) {
      // Find tenant where settings contains ownerEmail or email match
      const tenants = await this.tenantRepository.find();
      tenant = tenants.find(
        (t) =>
          t.settings?.ownerEmail?.toLowerCase() === email ||
          `${t.slug}@tenant.com` === email ||
          t.slug === email.split('@')[0],
      ) || null;
    }

    if (!tenant && slug) {
      // Auto-provision requested tenant workspace if first login
      const tenantName = slug
        .split(/[-_]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      tenant = await this.tenantRepository.save(
        this.tenantRepository.create({
          name: tenantName,
          slug,
          status: 'active',
          languages: ['en', 'ar'],
          timezone: 'Asia/Riyadh',
          greetingMessage: `Welcome to ${tenantName}!`,
          settings: { ownerEmail: email || `${slug}@tenant.com` },
        }),
      );
    }

    if (!tenant) {
      throw new NotFoundException(`Tenant workspace '${slug || email}' not found.`);
    }

    if (tenant.status !== 'active') {
      throw new UnauthorizedException(`Tenant '${tenant.name}' is currently paused. Please contact super admin.`);
    }

    // Get or create tenant API key
    let apiKeyEntity = await this.apiKeyRepository.findOne({
      where: { tenantId: tenant.id, isActive: true },
      order: { createdAt: 'DESC' },
    });

    let rawApiKey = 'kb_live_sk_' + tenant.slug + '_' + Math.random().toString(36).substring(2, 10);

    if (!apiKeyEntity) {
      rawApiKey = generateApiKey(`kb_live_sk_${tenant.slug}`);
      apiKeyEntity = await this.apiKeyRepository.save(
        this.apiKeyRepository.create({
          name: `${tenant.name} Key`,
          keyPrefix: rawApiKey.substring(0, 16),
          keyHash: hashApiKey(rawApiKey),
          tenantId: tenant.id,
          isActive: true,
        }),
      );
    } else {
      rawApiKey = apiKeyEntity.keyPrefix + '...';
    }

    const payload = {
      sub: tenant.id,
      tenantId: tenant.id,
      slug: tenant.slug,
      email: email || tenant.settings?.ownerEmail || `${tenant.slug}@tenant.com`,
      role: 'tenant_admin',
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        email: payload.email,
        name: tenant.name + ' Admin',
        role: 'tenant_admin',
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        languages: tenant.languages,
        timezone: tenant.timezone,
        apiEndpoint: tenant.apiEndpoint,
        greetingMessage: tenant.greetingMessage,
        apiKey: rawApiKey,
      },
    };
  }
}
