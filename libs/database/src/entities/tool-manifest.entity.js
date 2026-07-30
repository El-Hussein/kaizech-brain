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
exports.ToolManifestEntity = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const tenant_entity_1 = require("./tenant.entity");
let ToolManifestEntity = class ToolManifestEntity extends base_entity_1.BaseEntity {
    tenantId;
    name;
    description;
    parameters;
    apiEndpoint;
    httpMethod;
    headers;
    isActive;
    authType;
    authConfig;
    timeoutMs;
    tenant;
};
exports.ToolManifestEntity = ToolManifestEntity;
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], ToolManifestEntity.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ToolManifestEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ToolManifestEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], ToolManifestEntity.prototype, "parameters", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'api_endpoint' }),
    __metadata("design:type", String)
], ToolManifestEntity.prototype, "apiEndpoint", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'http_method', default: 'POST' }),
    __metadata("design:type", String)
], ToolManifestEntity.prototype, "httpMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ToolManifestEntity.prototype, "headers", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true, name: 'is_active' }),
    __metadata("design:type", Boolean)
], ToolManifestEntity.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'auth_type' }),
    __metadata("design:type", String)
], ToolManifestEntity.prototype, "authType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'auth_config', type: 'jsonb' }),
    __metadata("design:type", Object)
], ToolManifestEntity.prototype, "authConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 30000, name: 'timeout_ms' }),
    __metadata("design:type", Number)
], ToolManifestEntity.prototype, "timeoutMs", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.TenantEntity, (tenant) => tenant.toolManifests),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.TenantEntity)
], ToolManifestEntity.prototype, "tenant", void 0);
exports.ToolManifestEntity = ToolManifestEntity = __decorate([
    (0, typeorm_1.Entity)('tool_manifests')
], ToolManifestEntity);
//# sourceMappingURL=tool-manifest.entity.js.map