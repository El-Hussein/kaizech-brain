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
    const password = dto.password?.trim();

    if (!email && !slug) {
      throw new UnauthorizedException('Please enter your account email or workspace ID.');
    }

    if (!password) {
      throw new UnauthorizedException('Password is required.');
    }

    let tenant: TenantEntity | null = null;

    // 1. Try finding tenant by slug
    if (slug) {
      tenant = await this.tenantRepository.findOne({ where: { slug } });
    }

    // 2. Try finding tenant by email / ownerEmail if slug didn't match
    if (!tenant && email) {
      const tenants = await this.tenantRepository.find();
      tenant =
        tenants.find(
          (t) =>
            t.settings?.ownerEmail?.toLowerCase() === email ||
            t.slug === email.split('@')[0],
        ) || null;
    }

    // Strict rejection if tenant does not exist in DB
    if (!tenant) {
      throw new UnauthorizedException('Invalid account email, workspace ID, or password.');
    }

    // Verify Password against stored tenant account password
    const storedPassword = tenant.settings?.password;
    if (storedPassword && storedPassword !== password) {
      throw new UnauthorizedException('Invalid email, workspace ID, or password.');
    }

    // If password wasn't set yet on tenant, save it on first login
    if (!storedPassword && password) {
      tenant.settings = { ...(tenant.settings || {}), password };
      await this.tenantRepository.save(tenant);
    }

    // Verify tenant status is active
    if (tenant.status !== 'active') {
      throw new UnauthorizedException(`Tenant workspace '${tenant.name}' is paused or inactive. Please contact super admin.`);
    }

    // Retrieve active API key
    let apiKeyEntity = await this.apiKeyRepository.findOne({
      where: { tenantId: tenant.id, isActive: true },
      order: { createdAt: 'DESC' },
    });

    let rawApiKey = '';

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
        name: tenant.name + ' Owner',
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
