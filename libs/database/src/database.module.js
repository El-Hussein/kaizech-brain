"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const tenant_entity_1 = require("./entities/tenant.entity");
const api_key_entity_1 = require("./entities/api-key.entity");
const conversation_entity_1 = require("./entities/conversation.entity");
const message_entity_1 = require("./entities/message.entity");
const knowledge_source_entity_1 = require("./entities/knowledge-source.entity");
const knowledge_chunk_entity_1 = require("./entities/knowledge-chunk.entity");
const tool_manifest_entity_1 = require("./entities/tool-manifest.entity");
const prompt_template_entity_1 = require("./entities/prompt-template.entity");
const ticket_entity_1 = require("./entities/ticket.entity");
const user_profile_entity_1 = require("./entities/user-profile.entity");
const analytics_event_entity_1 = require("./entities/analytics-event.entity");
const entities = [
    tenant_entity_1.TenantEntity,
    api_key_entity_1.ApiKeyEntity,
    conversation_entity_1.ConversationEntity,
    message_entity_1.MessageEntity,
    knowledge_source_entity_1.KnowledgeSourceEntity,
    knowledge_chunk_entity_1.KnowledgeChunkEntity,
    tool_manifest_entity_1.ToolManifestEntity,
    prompt_template_entity_1.PromptTemplateEntity,
    ticket_entity_1.TicketEntity,
    user_profile_entity_1.UserProfileEntity,
    analytics_event_entity_1.AnalyticsEventEntity,
];
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('DB_HOST', 'localhost'),
                    port: configService.get('DB_PORT', 5432),
                    username: configService.get('DB_USERNAME', 'kaizech'),
                    password: configService.get('DB_PASSWORD', 'kaizech_secret_2024'),
                    database: configService.get('DB_DATABASE', 'kaizech_brain'),
                    entities,
                    synchronize: configService.get('NODE_ENV') === 'development',
                    logging: configService.get('NODE_ENV') === 'development' ? ['error', 'warn'] : ['error'],
                    ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
                }),
            }),
            typeorm_1.TypeOrmModule.forFeature(entities),
        ],
        exports: [typeorm_1.TypeOrmModule],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map