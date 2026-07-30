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
exports.ConversationEntity = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const tenant_entity_1 = require("./tenant.entity");
const message_entity_1 = require("./message.entity");
let ConversationEntity = class ConversationEntity extends base_entity_1.BaseEntity {
    tenantId;
    channelType;
    channelUserId;
    status;
    summary;
    metadata;
    language;
    messageCount;
    lastMessageAt;
    tenant;
    messages;
};
exports.ConversationEntity = ConversationEntity;
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], ConversationEntity.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'channel_type' }),
    __metadata("design:type", String)
], ConversationEntity.prototype, "channelType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'channel_user_id' }),
    __metadata("design:type", String)
], ConversationEntity.prototype, "channelUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'active' }),
    __metadata("design:type", String)
], ConversationEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ConversationEntity.prototype, "summary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ConversationEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ConversationEntity.prototype, "language", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'message_count', default: 0 }),
    __metadata("design:type", Number)
], ConversationEntity.prototype, "messageCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'last_message_at' }),
    __metadata("design:type", Date)
], ConversationEntity.prototype, "lastMessageAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.TenantEntity, (tenant) => tenant.conversations),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.TenantEntity)
], ConversationEntity.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => message_entity_1.MessageEntity, (msg) => msg.conversation),
    __metadata("design:type", Array)
], ConversationEntity.prototype, "messages", void 0);
exports.ConversationEntity = ConversationEntity = __decorate([
    (0, typeorm_1.Entity)('conversations')
], ConversationEntity);
//# sourceMappingURL=conversation.entity.js.map