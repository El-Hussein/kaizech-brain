"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantEntity = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const api_key_entity_1 = require("./api-key.entity");
const conversation_entity_1 = require("./conversation.entity");
const knowledge_source_entity_1 = require("./knowledge-source.entity");
const tool_manifest_entity_1 = require("./tool-manifest.entity");
const prompt_template_entity_1 = require("./prompt-template.entity");
let TenantEntity = class TenantEntity extends base_entity_1.BaseEntity {
    name;
    slug;
    logo;
    languages;
    timezone;
    greetingMessage;
    status;
    apiEndpoint;
    settings;
    branding;
    apiKeys;
    conversations;
    knowledgeSources;
    toolManifests;
    promptTemplates;
};
exports.TenantEntity = TenantEntity;
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], TenantEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], TenantEntity.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TenantEntity.prototype, "logo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', default: 'en' }),
    __metadata("design:type", Array)
], TenantEntity.prototype, "languages", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'UTC' }),
    __metadata("design:type", String)
], TenantEntity.prototype, "timezone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'greeting_message' }),
    __metadata("design:type", String)
], TenantEntity.prototype, "greetingMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'active' }),
    __metadata("design:type", String)
], TenantEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'api_endpoint' }),
    __metadata("design:type", String)
], TenantEntity.prototype, "apiEndpoint", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], TenantEntity.prototype, "settings", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], TenantEntity.prototype, "branding", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => api_key_entity_1.ApiKeyEntity, (apiKey) => apiKey.tenant),
    __metadata("design:type", Array)
], TenantEntity.prototype, "apiKeys", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => conversation_entity_1.ConversationEntity, (conv) => conv.tenant),
    __metadata("design:type", Array)
], TenantEntity.prototype, "conversations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => knowledge_source_entity_1.KnowledgeSourceEntity, (ks) => ks.tenant),
    __metadata("design:type", Array)
], TenantEntity.prototype, "knowledgeSources", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => tool_manifest_entity_1.ToolManifestEntity, (tm) => tm.tenant),
    __metadata("design:type", Array)
], TenantEntity.prototype, "toolManifests", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => prompt_template_entity_1.PromptTemplateEntity, (pt) => pt.tenant),
    __metadata("design:type", Array)
], TenantEntity.prototype, "promptTemplates", void 0);
exports.TenantEntity = TenantEntity = __decorate([
    (0, typeorm_1.Entity)('tenants')
], TenantEntity);
//# sourceMappingURL=tenant.entity.js.map