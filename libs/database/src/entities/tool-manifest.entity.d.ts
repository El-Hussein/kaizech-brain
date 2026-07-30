import { BaseEntity } from './base.entity';
import { TenantEntity } from './tenant.entity';
export declare class ToolManifestEntity extends BaseEntity {
    tenantId: string;
    name: string;
    description: string;
    parameters: Record<string, any>;
    apiEndpoint: string;
    httpMethod: string;
    headers: Record<string, string>;
    isActive: boolean;
    authType: string;
    authConfig: Record<string, any>;
    timeoutMs: number;
    tenant: TenantEntity;
}
