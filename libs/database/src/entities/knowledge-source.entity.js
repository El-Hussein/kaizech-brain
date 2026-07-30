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
exports.KnowledgeSourceEntity = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const tenant_entity_1 = require("./tenant.entity");
const knowledge_chunk_entity_1 = require("./knowledge-chunk.entity");
let KnowledgeSourceEntity = class KnowledgeSourceEntity extends base_entity_1.BaseEntity {
    tenantId;
    name;
    sourceType;
    filePath;
    url;
    status;
    chunkCount;
    errorMessage;
    metadata;
    tenant;
    chunks;
};
exports.KnowledgeSourceEntity = KnowledgeSourceEntity;
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], KnowledgeSourceEntity.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], KnowledgeSourceEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_type' }),
    __metadata("design:type", String)
], KnowledgeSourceEntity.prototype, "sourceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'file_path' }),
    __metadata("design:type", String)
], KnowledgeSourceEntity.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], KnowledgeSourceEntity.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'pending' }),
    __metadata("design:type", String)
], KnowledgeSourceEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'chunk_count', default: 0 }),
    __metadata("design:type", Number)
], KnowledgeSourceEntity.prototype, "chunkCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'error_message' }),
    __metadata("design:type", String)
], KnowledgeSourceEntity.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], KnowledgeSourceEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.TenantEntity, (tenant) => tenant.knowledgeSources),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.TenantEntity)
], KnowledgeSourceEntity.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => knowledge_chunk_entity_1.KnowledgeChunkEntity, (chunk) => chunk.source),
    __metadata("design:type", Array)
], KnowledgeSourceEntity.prototype, "chunks", void 0);
exports.KnowledgeSourceEntity = KnowledgeSourceEntity = __decorate([
    (0, typeorm_1.Entity)('knowledge_sources')
], KnowledgeSourceEntity);
//# sourceMappingURL=knowledge-source.entity.js.map