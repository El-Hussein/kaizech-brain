import { BaseEntity } from './base.entity';
import { TenantEntity } from './tenant.entity';
import { MessageEntity } from './message.entity';
export declare class ConversationEntity extends BaseEntity {
    tenantId: string;
    channelType: string;
    channelUserId: string;
    status: string;
    summary: string;
    metadata: Record<string, any>;
    language: string;
    messageCount: number;
    lastMessageAt: Date;
    tenant: TenantEntity;
    messages: MessageEntity[];
}
