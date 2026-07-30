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
exports.UserProfileEntity = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
let UserProfileEntity = class UserProfileEntity extends base_entity_1.BaseEntity {
    tenantId;
    channelUserId;
    channelType;
    displayName;
    preferredLanguage;
    timezone;
    preferences;
    metadata;
    lastInteractionAt;
};
exports.UserProfileEntity = UserProfileEntity;
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], UserProfileEntity.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'channel_user_id' }),
    __metadata("design:type", String)
], UserProfileEntity.prototype, "channelUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'channel_type' }),
    __metadata("design:type", String)
], UserProfileEntity.prototype, "channelType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'display_name' }),
    __metadata("design:type", String)
], UserProfileEntity.prototype, "displayName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'preferred_language' }),
    __metadata("design:type", String)
], UserProfileEntity.prototype, "preferredLanguage", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], UserProfileEntity.prototype, "timezone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], UserProfileEntity.prototype, "preferences", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], UserProfileEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'last_interaction_at' }),
    __metadata("design:type", Date)
], UserProfileEntity.prototype, "lastInteractionAt", void 0);
exports.UserProfileEntity = UserProfileEntity = __decorate([
    (0, typeorm_1.Entity)('user_profiles'),
    (0, typeorm_1.Index)('idx_user_profiles_tenant_channel', ['tenantId', 'channelUserId'], { unique: true })
], UserProfileEntity);
//# sourceMappingURL=user-profile.entity.js.map