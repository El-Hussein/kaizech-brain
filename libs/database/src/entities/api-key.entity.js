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
exports.ApiKeyEntity = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const tenant_entity_1 = require("./tenant.entity");
let ApiKeyEntity = class ApiKeyEntity extends base_entity_1.BaseEntity {
    keyHash;
    keyPrefix;
    name;
    isActive;
    expiresAt;
    lastUsedAt;
    tenantId;
    tenant;
};
exports.ApiKeyEntity = ApiKeyEntity;
__decorate([
    (0, typeorm_1.Column)({ name: 'key_hash', unique: true }),
    __metadata("design:type", String)
], ApiKeyEntity.prototype, "keyHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'key_prefix' }),
    __metadata("design:type", String)
], ApiKeyEntity.prototype, "keyPrefix", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ApiKeyEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true, name: 'is_active' }),
    __metadata("design:type", Boolean)
], ApiKeyEntity.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'expires_at' }),
    __metadata("design:type", Date)
], ApiKeyEntity.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'last_used_at' }),
    __metadata("design:type", Date)
], ApiKeyEntity.prototype, "lastUsedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], ApiKeyEntity.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.TenantEntity, (tenant) => tenant.apiKeys),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.TenantEntity)
], ApiKeyEntity.prototype, "tenant", void 0);
exports.ApiKeyEntity = ApiKeyEntity = __decorate([
    (0, typeorm_1.Entity)('api_keys')
], ApiKeyEntity);
//# sourceMappingURL=api-key.entity.js.map