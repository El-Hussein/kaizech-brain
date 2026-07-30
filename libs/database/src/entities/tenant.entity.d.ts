import { BaseEntity } from './base.entity';
import { ApiKeyEntity } from './api-key.entity';
import { ConversationEntity } from './conversation.entity';
import { KnowledgeSourceEntity } from './knowledge-source.entity';
import { ToolManifestEntity } from './tool-manifest.entity';
import { PromptTemplateEntity } from './prompt-template.entity';
export declare class TenantEntity extends BaseEntity {
    name: string;
    slug: string;
    logo: string;
    languages: string[];
    timezone: string;
    greetingMessage: string;
    status: string;
    apiEndpoint: string;
    settings: Record<string, any>;
    branding: {
        primaryColor?: string;
        secondaryColor?: string;
        welcomeMessage?: string;
        supportEmail?: string;
        supportPhone?: string;
        workingHours?: string;
    };
    apiKeys: ApiKeyEntity[];
    conversations: ConversationEntity[];
    knowledgeSources: KnowledgeSourceEntity[];
    toolManifests: ToolManifestEntity[];
    promptTemplates: PromptTemplateEntity[];
}
