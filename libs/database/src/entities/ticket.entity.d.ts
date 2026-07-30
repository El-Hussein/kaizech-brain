import { BaseEntity } from './base.entity';
export declare class TicketEntity extends BaseEntity {
    tenantId: string;
    conversationId: string;
    status: string;
    reason: string;
    assignedTo: string;
    priority: string;
    metadata: Record<string, any>;
    resolvedAt: Date;
}
