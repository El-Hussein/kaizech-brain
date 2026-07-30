import { BaseEntity } from './base.entity';
export declare class AnalyticsEventEntity extends BaseEntity {
    tenantId: string;
    eventType: string;
    data: Record<string, any>;
    conversationId: string;
    channelType: string;
}
