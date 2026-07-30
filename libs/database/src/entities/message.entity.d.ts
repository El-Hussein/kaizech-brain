import { BaseEntity } from './base.entity';
import { ConversationEntity } from './conversation.entity';
export declare class MessageEntity extends BaseEntity {
    conversationId: string;
    role: string;
    content: string;
    channelType: string;
    toolCalls: any[];
    toolResult: any;
    tokenUsagePrompt: number;
    tokenUsageCompletion: number;
    responseTimeMs: number;
    metadata: Record<string, any>;
    conversation: ConversationEntity;
}
