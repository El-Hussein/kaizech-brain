import { BaseEntity } from './base.entity';
import { TenantEntity } from './tenant.entity';
import { KnowledgeChunkEntity } from './knowledge-chunk.entity';
export declare class KnowledgeSourceEntity extends BaseEntity {
    tenantId: string;
    name: string;
    sourceType: string;
    filePath: string;
    url: string;
    status: string;
    chunkCount: number;
    errorMessage: string;
    metadata: Record<string, any>;
    tenant: TenantEntity;
    chunks: KnowledgeChunkEntity[];
}
