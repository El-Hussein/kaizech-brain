import { BaseEntity } from './base.entity';
import { TenantEntity } from './tenant.entity';
export declare class ApiKeyEntity extends BaseEntity {
    keyHash: string;
    keyPrefix: string;
    name: string;
    isActive: boolean;
    expiresAt: Date;
    lastUsedAt: Date;
    tenantId: string;
    tenant: TenantEntity;
}
