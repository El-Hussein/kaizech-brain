import { BaseEntity } from './base.entity';
export declare class UserProfileEntity extends BaseEntity {
    tenantId: string;
    channelUserId: string;
    channelType: string;
    displayName: string;
    preferredLanguage: string;
    timezone: string;
    preferences: Record<string, any>;
    metadata: Record<string, any>;
    lastInteractionAt: Date;
}
