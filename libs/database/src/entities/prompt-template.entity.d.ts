import { BaseEntity } from './base.entity';
import { TenantEntity } from './tenant.entity';
export declare class PromptTemplateEntity extends BaseEntity {
    tenantId: string;
    isActive: boolean;
    identity: string;
    businessRules: string;
    safetyRules: string;
    customInstructions: string;
    tone: string;
    restrictions: string[];
    metadata: Record<string, any>;
    tenant: TenantEntity;
}
