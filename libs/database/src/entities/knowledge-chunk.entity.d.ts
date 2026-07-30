import { BaseEntity } from './base.entity';
import { KnowledgeSourceEntity } from './knowledge-source.entity';
export declare class KnowledgeChunkEntity extends BaseEntity {
    tenantId: string;
    sourceId: string;
    content: string;
    embedding: string;
    chunkIndex: number;
    metadata: Record<string, any>;
    source: KnowledgeSourceEntity;
}
