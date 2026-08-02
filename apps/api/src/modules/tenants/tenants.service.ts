import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntity, ApiKeyEntity } from '@kaizech/database';
import { generateApiKey, hashApiKey, encryptSecret } from '@kaizech/shared';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(ApiKeyEntity)
    private readonly apiKeyRepository: Repository<ApiKeyEntity>,
  ) {}

  async create(dto: CreateTenantDto) {
    const existing = await this.tenantRepository.findOne({
      where: [{ name: dto.name }, { slug: dto.slug }],
    });
    if (existing) {
      throw new ConflictException('Tenant with this name or slug already exists');
    }

    const tenant = this.tenantRepository.create({
      name: dto.name,
      slug: dto.slug,
      languages: dto.languages || ['en'],
      timezone: dto.timezone || 'UTC',
      greetingMessage: dto.greetingMessage,
      apiEndpoint: dto.apiEndpoint,
      branding: dto.branding,
      settings: dto.settings,
    });

    const savedTenant = await this.tenantRepository.save(tenant);
    this.logger.log(`Created tenant: ${savedTenant.name} (${savedTenant.id})`);

    // Generate initial API key
    const rawKey = generateApiKey('kb_live_sk');
    const apiKey = this.apiKeyRepository.create({
      keyHash: hashApiKey(rawKey),
      keyPrefix: rawKey.substring(0, 14),
      name: 'Default API Key',
      tenantId: savedTenant.id,
    });
    await this.apiKeyRepository.save(apiKey);

    return {
      tenant: savedTenant,
      apiKey: rawKey,
      message: 'Store this API key securely. It will not be shown again.',
    };
  }

  async findAll() {
    return this.tenantRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    let tenant = await this.tenantRepository.findOne({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      relations: ['knowledgeSources', 'toolManifests', 'promptTemplates'],
    });

    if (!tenant && idOrSlug === 'mrkoon-auctions') {
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

    if (!tenant) {
      throw new NotFoundException(`Tenant '${idOrSlug}' not found`);
    }

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.findOne(id);
    if (dto.settings) {
      const mergedSettings = { ...(tenant.settings || {}), ...dto.settings };
      if (mergedSettings.openaiApiKey && typeof mergedSettings.openaiApiKey === 'string' && !mergedSettings.openaiApiKey.startsWith('enc_v1:')) {
        mergedSettings.openaiApiKey = encryptSecret(mergedSettings.openaiApiKey);
      }
      if (mergedSettings.whatsappAppSecret && typeof mergedSettings.whatsappAppSecret === 'string' && !mergedSettings.whatsappAppSecret.startsWith('enc_v1:')) {
        mergedSettings.whatsappAppSecret = encryptSecret(mergedSettings.whatsappAppSecret);
      }
      tenant.settings = mergedSettings;
    }
    const { settings, ...rest } = dto as any;
    Object.assign(tenant, rest);
    return this.tenantRepository.save(tenant);
  }

  async remove(id: string) {
    const tenant = await this.findOne(id);
    await this.tenantRepository.softRemove(tenant);
    return { message: `Tenant '${tenant.name}' has been deactivated` };
  }

  async generateApiKey(tenantId: string, name: string) {
    await this.findOne(tenantId); // Verify tenant exists
    const rawKey = generateApiKey('kb_live_sk');
    const apiKey = this.apiKeyRepository.create({
      keyHash: hashApiKey(rawKey),
      keyPrefix: rawKey.substring(0, 14),
      name,
      tenantId,
    });
    await this.apiKeyRepository.save(apiKey);

    return {
      apiKey: rawKey,
      name,
      message: 'Store this API key securely. It will not be shown again.',
    };
  }

  async listApiKeys(tenantId: string) {
    return this.apiKeyRepository.find({
      where: { tenantId },
      select: ['id', 'keyPrefix', 'name', 'isActive', 'lastUsedAt', 'expiresAt', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async revokeApiKey(tenantId: string, keyId: string) {
    const key = await this.apiKeyRepository.findOne({
      where: { id: keyId, tenantId },
    });
    if (!key) {
      throw new NotFoundException('API key not found');
    }
    key.isActive = false;
    return this.apiKeyRepository.save(key);
  }
}
